import "server-only";
import {
	and,
	asc,
	count,
	desc,
	eq,
	inArray,
	isNotNull,
	isNull,
	sql,
} from "drizzle-orm";
import { db } from "@/lib/db";
import {
	client,
	document,
	documentShare,
	folder,
	folderShare,
} from "@/lib/db/schema";
import { sendInviteEmail } from "@/lib/email/invite-email";
import { logActivities, logActivity } from "@/lib/dms/activity";
import { DmsError } from "@/lib/dms/errors";
import { isUuid } from "@/lib/dms/format";
import { inviteUrl } from "@/lib/dms/invites";
import {
	assertCan,
	downloadableDocuments,
	visibleDocuments,
	type Actor,
} from "@/lib/dms/permissions";
import { generateToken, INVITE_TTL_MS, normalizeEmail } from "@/lib/dms/tokens";
import { MAX_FOLDER_DEPTH } from "@/lib/dms/uploads";

export type FolderItem = {
	id: string;
	name: string;
	parentId: string | null;
	clientId: string;
	clientName: string;
	createdAt: Date;
	/** Documents the actor can see in this folder and everything below it. */
	documentCount: number;
	/** How many of those the actor may download. */
	downloadableCount: number;
};

/** Joins the actor's accepted share, as `visibleDocuments` needs. */
function actorShare(actor: Actor) {
	return and(
		eq(documentShare.documentId, document.id),
		eq(documentShare.userId, actor.id),
		eq(documentShare.status, "accepted"),
	);
}

/**
 * Every folder holding something the actor can see, directly or further down.
 * Folders with nothing visible are left out, so their names don't leak.
 */
export async function listFolders(actor: Actor, clientId?: string) {
	const inClient = isUuid(clientId) ? clientId : undefined;
	const downloadable = downloadableDocuments(actor);
	const counts = await db
		.select({
			folderId: document.folderId,
			total: count(),
			downloadable: downloadable
				? sql<number>`count(*) filter (where ${downloadable})`.mapWith(Number)
				: count(),
		})
		.from(document)
		.leftJoin(documentShare, actorShare(actor))
		.where(
			and(
				isNotNull(document.folderId),
				inClient ? eq(document.clientId, inClient) : undefined,
				visibleDocuments(actor),
			),
		)
		.groupBy(document.folderId);

	const byId = new Map<string, FolderItem>();
	if (counts.length === 0) return byId;

	const rows = await db
		.select({
			id: folder.id,
			name: folder.name,
			parentId: folder.parentId,
			clientId: folder.clientId,
			clientName: client.name,
			createdAt: folder.createdAt,
		})
		.from(folder)
		.innerJoin(client, eq(client.id, folder.clientId))
		.where(inClient ? eq(folder.clientId, inClient) : undefined)
		.orderBy(asc(folder.name), asc(client.name));
	for (const row of rows) {
		byId.set(row.id, { ...row, documentCount: 0, downloadableCount: 0 });
	}

	for (const { folderId, total, downloadable } of counts) {
		for (const item of folderPath(byId, folderId)) {
			item.documentCount += total;
			item.downloadableCount += downloadable;
		}
	}
	for (const [id, item] of byId) {
		if (item.documentCount === 0) byId.delete(id);
	}
	return byId;
}

/** The folders from the top level down to (and including) this one. */
export function folderPath(
	folders: Map<string, FolderItem>,
	folderId: string | null,
) {
	const path: FolderItem[] = [];
	let current = folderId ? folders.get(folderId) : undefined;
	while (current) {
		path.unshift(current);
		current = current.parentId ? folders.get(current.parentId) : undefined;
	}
	return path;
}

/** "Design/Logos" → ["Design", "Logos"], cleaned up for storing. */
function folderNames(path: string) {
	const names = path
		.split("/")
		.map((name) =>
			name
				// macOS splits accented letters in two; other systems don't.
				.normalize("NFC")
				// Control characters (Postgres rejects NUL outright).
				.replace(/\p{Cc}/gu, "")
				.trim()
				.slice(0, 255),
		)
		.filter((name) => name && name !== "." && name !== "..");
	if (names.length > MAX_FOLDER_DEPTH) {
		throw new DmsError(`Folders can be at most ${MAX_FOLDER_DEPTH} levels deep.`);
	}
	return names;
}

/**
 * Finds or creates each folder path under `parentId` (null for the client's
 * top level). Returns the folder id for each path. Callers must have checked
 * the actor may upload to this client.
 */
export async function ensureFolders(
	actor: Actor,
	clientId: string,
	parentId: string | null,
	paths: string[],
) {
	const result = new Map<string, string | null>();
	const seen = new Map<string, string>();

	for (const path of new Set(paths)) {
		let current = parentId;
		for (const name of folderNames(path)) {
			const key = `${current}/${name}`;
			const id =
				seen.get(key) ?? (await ensureFolder(actor, clientId, current, name));
			seen.set(key, id);
			current = id;
		}
		result.set(path, current);
	}
	return result;
}

async function ensureFolder(
	actor: Actor,
	clientId: string,
	parentId: string | null,
	name: string,
) {
	const find = () =>
		db.query.folder.findFirst({
			columns: { id: true },
			where: and(
				eq(folder.clientId, clientId),
				parentId ? eq(folder.parentId, parentId) : isNull(folder.parentId),
				eq(folder.name, name),
			),
		});

	const existing = await find();
	if (existing) return existing.id;

	const [created] = await db
		.insert(folder)
		.values({ clientId, parentId, name, createdBy: actor.id })
		// Someone else may have just created it.
		.onConflictDoNothing()
		.returning({ id: folder.id });
	const row = created ?? (await find());
	if (!row) throw new DmsError("Couldn't create the folder. Try again.");
	return row.id;
}

/** "Design/Logos" for each folder id, for activity entries and emails. */
export async function folderPathNames(folderIds: (string | null)[]) {
	const paths = new Map<string, string>();
	const ids = [...new Set(folderIds.filter((id) => id !== null))];
	if (ids.length === 0) return paths;

	const found = await db
		.selectDistinct({ clientId: folder.clientId })
		.from(folder)
		.where(inArray(folder.id, ids));
	const rows = await db
		.select({ id: folder.id, name: folder.name, parentId: folder.parentId })
		.from(folder)
		.where(
			inArray(
				folder.clientId,
				found.map((f) => f.clientId),
			),
		);
	const byId = new Map(rows.map((row) => [row.id, row]));
	for (const id of ids) {
		const names: string[] = [];
		let current = byId.get(id);
		while (current) {
			names.unshift(current.name);
			current = current.parentId ? byId.get(current.parentId) : undefined;
		}
		paths.set(id, names.join("/"));
	}
	return paths;
}

// Downloading a folder

export type FolderDownloadFile = {
	id: string;
	/** Path inside the zip, e.g. "Logos/mark.svg". Unique. */
	path: string;
	storageKey: string;
	sizeBytes: number;
	createdAt: Date;
};

/**
 * Every file in a folder and its subfolders that the actor may download, with
 * its path inside the zip, and logs a download for each. Files the actor can
 * only view are left out.
 */
export async function prepareFolderDownload(actor: Actor, folderId: string) {
	const root = isUuid(folderId)
		? await db.query.folder.findFirst({ where: eq(folder.id, folderId) })
		: undefined;
	if (!root) throw new DmsError("Folder not found.");

	const all = await db
		.select({ id: folder.id, name: folder.name, parentId: folder.parentId })
		.from(folder)
		.where(eq(folder.clientId, root.clientId));
	// Path of each folder below the root, relative to it ("" for the root).
	const dirs = new Map<string, string>([[root.id, ""]]);
	const children = new Map<string, typeof all>();
	for (const f of all) {
		if (f.parentId) children.set(f.parentId, [...(children.get(f.parentId) ?? []), f]);
	}
	const stack = [root.id];
	while (stack.length > 0) {
		const parent = stack.pop()!;
		for (const child of children.get(parent) ?? []) {
			dirs.set(child.id, `${dirs.get(parent)}${zipSafe(child.name)}/`);
			stack.push(child.id);
		}
	}

	const docs = await db
		.select({
			id: document.id,
			name: document.name,
			folderId: document.folderId,
			storageKey: document.storageKey,
			sizeBytes: document.sizeBytes,
			createdAt: document.createdAt,
		})
		.from(document)
		.leftJoin(documentShare, actorShare(actor))
		.where(
			and(
				inArray(document.folderId, [...dirs.keys()]),
				visibleDocuments(actor),
				downloadableDocuments(actor),
			),
		)
		.orderBy(asc(document.name), asc(document.createdAt));
	if (docs.length === 0) {
		throw new DmsError("There's nothing in this folder you can download.");
	}

	// Two files can share a name; the zip needs unique paths.
	const taken = new Set<string>();
	const files: FolderDownloadFile[] = docs.map((doc) => {
		const dir = dirs.get(doc.folderId!) ?? "";
		const name = zipSafe(doc.name);
		const dot = name.lastIndexOf(".");
		const [stem, ext] = dot > 0 ? [name.slice(0, dot), name.slice(dot)] : [name, ""];
		let path = `${dir}${name}`;
		for (let n = 2; taken.has(path.toLowerCase()); n++) {
			path = `${dir}${stem} (${n})${ext}`;
		}
		taken.add(path.toLowerCase());
		return { ...doc, path };
	});

	const [rootPath] = (await folderPathNames([root.id])).values();
	await logActivities(
		docs.map((doc) => ({
			actorId: actor.id,
			action: "document.download" as const,
			documentId: doc.id,
			clientId: root.clientId,
			metadata: { name: doc.name, viaFolder: rootPath },
		})),
	);
	return { name: root.name, files };
}

/** File and folder names can't contain path separators inside a zip. */
function zipSafe(name: string) {
	return name.replace(/[/\\]/g, "_").trim() || "Untitled";
}

// Sharing a folder

async function findFolder(id: string) {
	const row = isUuid(id)
		? await db.query.folder.findFirst({ where: eq(folder.id, id) })
		: undefined;
	if (!row) throw new DmsError("Folder not found.");
	return row;
}

export async function listFolderShares(actor: Actor, folderId: string) {
	assertCan(actor, "canShare");
	if (!isUuid(folderId)) return [];
	const shares = await db.query.folderShare.findMany({
		where: eq(folderShare.folderId, folderId),
		orderBy: desc(folderShare.createdAt),
		columns: { tokenHash: false },
	});
	const now = new Date();
	return shares.map((s) => ({
		...s,
		expired: s.status === "pending" && s.expiresAt < now,
	}));
}

/**
 * Emails someone a link to a folder. Once they accept, they can see every
 * document in it and its subfolders, including ones added later. Re-sharing
 * with the same email replaces the old invite.
 */
export async function shareFolder(
	actor: Actor,
	folderId: string,
	input: { email: string; access: "view" | "download" },
) {
	assertCan(actor, "canShare");
	const target = await findFolder(folderId);
	const email = normalizeEmail(input.email);
	if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
		throw new DmsError("Enter a valid email address.");
	}
	if (email === normalizeEmail(actor.email)) {
		throw new DmsError("You can't share a folder with yourself.");
	}

	const { token, tokenHash } = generateToken();
	const values = {
		access: input.access,
		status: "pending" as const,
		userId: null,
		acceptedAt: null,
		tokenHash,
		invitedBy: actor.id,
		expiresAt: new Date(Date.now() + INVITE_TTL_MS),
	};
	await db
		.insert(folderShare)
		.values({ folderId, email, ...values })
		.onConflictDoUpdate({
			target: [folderShare.folderId, folderShare.email],
			set: values,
		});

	const [path] = (await folderPathNames([folderId])).values();
	await sendInviteEmail({
		kind: "folder",
		to: email,
		inviterName: actor.name,
		inviterEmail: actor.email,
		folderName: target.name,
		url: inviteUrl(token),
	});
	await logActivity({
		actorId: actor.id,
		action: "share.invite",
		clientId: target.clientId,
		metadata: { name: path, kind: "folder", folderId, email, access: input.access },
	});
}

export async function revokeFolderShare(actor: Actor, shareId: string) {
	assertCan(actor, "canShare");
	if (!isUuid(shareId)) throw new DmsError("Share not found.");
	const share = await db.query.folderShare.findFirst({
		where: eq(folderShare.id, shareId),
		with: { folder: true },
	});
	if (!share) throw new DmsError("Share not found.");

	await db
		.update(folderShare)
		.set({ status: "revoked" })
		.where(eq(folderShare.id, shareId));
	const [path] = (await folderPathNames([share.folderId])).values();
	await logActivity({
		actorId: actor.id,
		action: "share.revoke",
		clientId: share.folder.clientId,
		metadata: { name: path, kind: "folder", folderId: share.folderId, email: share.email },
	});
	return share.folderId;
}
