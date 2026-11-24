import "server-only";
import { and, asc, count, eq, inArray, isNotNull, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { client, document, documentShare, folder } from "@/lib/db/schema";
import { DmsError } from "@/lib/dms/errors";
import { isUuid } from "@/lib/dms/format";
import { visibleDocuments, type Actor } from "@/lib/dms/permissions";
import { MAX_FOLDER_DEPTH } from "@/lib/dms/uploads";

export type FolderItem = {
	id: string;
	name: string;
	parentId: string | null;
	clientId: string;
	clientName: string;
	/** Documents the actor can see in this folder and everything below it. */
	documentCount: number;
};

/**
 * Every folder holding something the actor can see, directly or further down.
 * Folders with nothing visible are left out, so their names don't leak.
 */
export async function listFolders(actor: Actor, clientId?: string) {
	const inClient = isUuid(clientId) ? clientId : undefined;
	const counts = await db
		.select({ folderId: document.folderId, total: count() })
		.from(document)
		.leftJoin(
			documentShare,
			and(
				eq(documentShare.documentId, document.id),
				eq(documentShare.userId, actor.id),
				eq(documentShare.status, "accepted"),
			),
		)
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
		})
		.from(folder)
		.innerJoin(client, eq(client.id, folder.clientId))
		.where(inClient ? eq(folder.clientId, inClient) : undefined)
		.orderBy(asc(folder.name), asc(client.name));
	for (const row of rows) byId.set(row.id, { ...row, documentCount: 0 });

	for (const { folderId, total } of counts) {
		for (const item of folderPath(byId, folderId)) item.documentCount += total;
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
