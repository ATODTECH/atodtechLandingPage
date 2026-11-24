import "server-only";
import { randomUUID } from "node:crypto";
import { after } from "next/server";
import { and, asc, desc, eq, ilike, inArray, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import {
	client,
	document,
	documentShare,
	folder,
	user,
} from "@/lib/db/schema";
import { sendClientUploadEmail } from "@/lib/email/client-upload-email";
import { sendInviteEmail } from "@/lib/email/invite-email";
import {
	buildStorageKey,
	deleteObject,
	getDownloadUrl,
	getUploadUrl,
	headObject,
} from "@/lib/storage";
import { logActivity } from "@/lib/dms/activity";
import { DmsError, ForbiddenError } from "@/lib/dms/errors";
import { ensureFolders, folderPathNames } from "@/lib/dms/folders";
import { isUuid } from "@/lib/dms/format";
import { inviteUrl } from "@/lib/dms/invites";
import {
	assertCan,
	canAccessDocument,
	canDeleteDocument,
	canRenameDocument,
	canUploadTo,
	isStaff,
	type Actor,
	visibleDocuments,
} from "@/lib/dms/permissions";
import { generateToken, INVITE_TTL_MS, normalizeEmail } from "@/lib/dms/tokens";
import { UPLOAD_BATCH_SIZE, uploadProblem } from "@/lib/dms/uploads";

export type DocumentListItem = {
	id: string;
	name: string;
	mimeType: string;
	sizeBytes: number;
	visibility: "private" | "public";
	createdAt: Date;
	clientId: string;
	clientName: string;
	uploaderName: string | null;
	uploadedByClient: boolean;
	folderId: string | null;
	canDownload: boolean;
};

/**
 * Documents the actor can see, newest first. `folderId` limits them to one
 * folder, or to the top level when null.
 */
export async function listDocuments(
	actor: Actor,
	filters: { clientId?: string; query?: string; folderId?: string | null } = {},
): Promise<DocumentListItem[]> {
	const staff = isStaff(actor);

	const rows = await db
		.select({
			id: document.id,
			name: document.name,
			mimeType: document.mimeType,
			sizeBytes: document.sizeBytes,
			visibility: document.visibility,
			createdAt: document.createdAt,
			clientId: document.clientId,
			clientName: client.name,
			uploaderName: user.name,
			uploadedByClient: document.uploadedByClient,
			folderId: document.folderId,
			shareAccess: documentShare.access,
		})
		.from(document)
		.innerJoin(client, eq(client.id, document.clientId))
		.leftJoin(user, eq(user.id, document.uploadedBy))
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
				visibleDocuments(actor),
				isUuid(filters.clientId)
					? eq(document.clientId, filters.clientId)
					: undefined,
				filters.folderId === undefined
					? undefined
					: filters.folderId === null
						? isNull(document.folderId)
						: eq(document.folderId, filters.folderId),
				filters.query
					? ilike(document.name, `%${filters.query.replace(/[\\%_]/g, "\\$&")}%`)
					: undefined,
			),
		)
		.orderBy(desc(document.createdAt), asc(document.name));

	return rows.map(({ shareAccess, ...row }) => ({
		...row,
		canDownload:
			staff ||
			row.visibility === "public" ||
			shareAccess === "download" ||
			(row.uploadedByClient && actor.clientIds.includes(row.clientId)),
	}));
}

async function findDocument(id: string) {
	if (!isUuid(id)) throw new DmsError("Document not found.");
	const doc = await db.query.document.findFirst({
		where: eq(document.id, id),
		with: { client: true, uploader: true },
	});
	if (!doc || doc.deletedAt) throw new DmsError("Document not found.");
	return doc;
}

/** A single document, if the actor may view it. */
export async function getDocument(actor: Actor, id: string) {
	const doc = await findDocument(id);
	if (!(await canAccessDocument(actor, doc, "view"))) {
		throw new DmsError("Document not found.");
	}
	return {
		...doc,
		canDownload: await canAccessDocument(actor, doc, "download"),
		canRename: canRenameDocument(actor, doc),
		canDelete: canDeleteDocument(actor, doc),
	};
}

export type UploadRequest = {
	fileName: string;
	mimeType: string;
	sizeBytes: number;
	/** Folders to put the file in, e.g. "Design/Logos". Created if missing. */
	folderPath?: string;
	/** A document from an earlier failed attempt, so retries reuse its record. */
	documentId?: string;
};

export type UploadTicket =
	| { ok: true; documentId: string; uploadUrl: string | null }
	| { ok: false; error: string };

/**
 * Step 1 of an upload: records pending documents and returns short-lived URLs
 * the browser PUTs the files to directly, so files never pass through the
 * Next.js server. Returns one result per file, in order; a null URL means an
 * earlier attempt already succeeded.
 */
export async function requestUploads(
	actor: Actor,
	input: {
		clientId: string;
		/** Folder being uploaded into; null for the client's top level. */
		folderId?: string | null;
		files: UploadRequest[];
	},
): Promise<UploadTicket[]> {
	if (input.files.length === 0 || input.files.length > UPLOAD_BATCH_SIZE) {
		throw new DmsError(`Upload between 1 and ${UPLOAD_BATCH_SIZE} files at a time.`);
	}
	const owner = isUuid(input.clientId)
		? await db.query.client.findFirst({ where: eq(client.id, input.clientId) })
		: undefined;
	if (!owner) throw new DmsError("Choose a client for this document.");
	// Clients may only upload into their own companies' folders.
	if (!canUploadTo(actor, owner.id)) throw new ForbiddenError();

	const parentId = input.folderId ?? null;
	if (parentId !== null) {
		const parent = isUuid(parentId)
			? await db.query.folder.findFirst({
					where: and(eq(folder.id, parentId), eq(folder.clientId, owner.id)),
				})
			: undefined;
		if (!parent) throw new DmsError("That folder no longer exists.");
	}

	const retryIds = input.files.map((f) => f.documentId).filter(isUuid);
	const earlier = new Map(
		retryIds.length > 0
			? (
					await db.query.document.findMany({
						where: and(
							inArray(document.id, retryIds),
							eq(document.uploadedBy, actor.id),
							eq(document.clientId, owner.id),
							isNull(document.deletedAt),
						),
					})
				).map((doc) => [doc.id, doc])
			: [],
	);

	const problems = input.files.map((file) => uploadProblem(file));
	const folders = await ensureFolders(
		actor,
		owner.id,
		parentId,
		input.files.filter((_, i) => !problems[i]).map((f) => f.folderPath ?? ""),
	);

	const rows: (typeof document.$inferInsert)[] = [];
	const tickets = input.files.map(async (file, i): Promise<UploadTicket> => {
		const problem = problems[i];
		if (problem) return { ok: false, error: problem };

		const name = file.fileName.trim().slice(0, 255) || "Untitled";
		const previous = file.documentId ? earlier.get(file.documentId) : undefined;
		if (
			previous &&
			previous.sizeBytes === file.sizeBytes &&
			previous.mimeType === file.mimeType
		) {
			return {
				ok: true,
				documentId: previous.id,
				uploadUrl:
					previous.status === "ready"
						? null
						: await getUploadUrl(previous.storageKey, previous.mimeType),
			};
		}

		const id = randomUUID();
		const storageKey = buildStorageKey(owner.id, id, name);
		rows.push({
			id,
			clientId: owner.id,
			folderId: folders.get(file.folderPath ?? "") ?? null,
			name,
			storageKey,
			mimeType: file.mimeType,
			sizeBytes: file.sizeBytes,
			uploadedBy: actor.id,
			uploadedByClient: actor.role === "client",
		});
		return {
			ok: true,
			documentId: id,
			uploadUrl: await getUploadUrl(storageKey, file.mimeType),
		};
	});

	const results = await Promise.all(tickets);
	if (rows.length > 0) await db.insert(document).values(rows);
	return results;
}

/**
 * Step 2 of an upload: checks each file reached Spaces, then publishes it.
 * Returns an error message, or null for success, per document in order.
 */
export async function confirmUploads(
	actor: Actor,
	ids: string[],
): Promise<(string | null)[]> {
	if (ids.length === 0 || ids.length > UPLOAD_BATCH_SIZE) {
		throw new DmsError(`Upload between 1 and ${UPLOAD_BATCH_SIZE} files at a time.`);
	}
	const validIds = ids.filter(isUuid);
	// Only whoever started the upload can confirm it.
	const docs = new Map(
		validIds.length > 0
			? (
					await db.query.document.findMany({
						where: and(
							inArray(document.id, validIds),
							eq(document.uploadedBy, actor.id),
							isNull(document.deletedAt),
						),
					})
				).map((doc) => [doc.id, doc])
			: [],
	);
	const folderPaths = await folderPathNames(
		[...docs.values()].map((doc) => doc.folderId),
	);

	return Promise.all(
		ids.map(async (id) => {
			const doc = docs.get(id);
			if (!doc) return "Upload not found.";
			if (doc.status === "ready") return null;

			try {
				const head = await headObject(doc.storageKey);
				if (!head) return "The file didn't finish uploading. Try again.";
				if (head.size !== doc.sizeBytes) {
					await deleteObject(doc.storageKey);
					return "The uploaded file was incomplete. Try again.";
				}

				const published = await db
					.update(document)
					.set({ status: "ready", notifyPending: doc.uploadedByClient })
					.where(and(eq(document.id, id), eq(document.status, "pending")))
					.returning({ id: document.id });
				// Another confirm got there first, and has logged it.
				if (published.length === 0) return null;

				await logActivity({
					actorId: actor.id,
					action: "document.upload",
					documentId: id,
					clientId: doc.clientId,
					metadata: {
						name: doc.name,
						sizeBytes: doc.sizeBytes,
						folder: doc.folderId ? folderPaths.get(doc.folderId) : undefined,
					},
				});
				return null;
			} catch (error) {
				// One bad file shouldn't fail the rest of the batch.
				console.error("Confirming upload failed:", error);
				return "Something went wrong. Please try again.";
			}
		}),
	);
}

/**
 * Step 3 of an upload: emails every owner one summary of what a client has
 * uploaded since the last one. Safe to call more than once, and picks up
 * anything left over from an upload that was interrupted.
 */
export async function finishUploads(actor: Actor) {
	if (actor.role !== "client") return;
	// Claims the documents, so overlapping calls never email about them twice.
	const docs = await db
		.update(document)
		.set({ notifyPending: false })
		.where(
			and(
				eq(document.uploadedBy, actor.id),
				eq(document.notifyPending, true),
				isNull(document.deletedAt),
			),
		)
		.returning({
			id: document.id,
			name: document.name,
			clientId: document.clientId,
			folderId: document.folderId,
		});
	if (docs.length === 0) return;

	// Sent after the response, so the uploader isn't kept waiting.
	after(() =>
		notifyOwnersOfClientUpload(actor, docs).catch((error) =>
			console.error("Client upload notification failed:", error),
		),
	);
}

/** Emails every owner, once per company. A failed email never fails the upload. */
async function notifyOwnersOfClientUpload(
	actor: Actor,
	docs: {
		id: string;
		name: string;
		clientId: string;
		folderId: string | null;
	}[],
) {
	const [owners, companies, folderPaths] = await Promise.all([
		db.select({ email: user.email }).from(user).where(eq(user.role, "owner")),
		db
			.select({ id: client.id, name: client.name })
			.from(client)
			.where(
				inArray(
					client.id,
					docs.map((doc) => doc.clientId),
				),
			),
		folderPathNames(docs.map((doc) => doc.folderId)),
	]);

	for (const company of companies) {
		const uploaded = docs.filter((doc) => doc.clientId === company.id);
		const names = uploaded.map((doc) => {
			const path = doc.folderId ? folderPaths.get(doc.folderId) : undefined;
			return path ? `${path}/${doc.name}` : doc.name;
		});
		const path =
			uploaded.length === 1
				? `/portal/documents/${uploaded[0].id}`
				: `/portal?client=${company.id}`;

		await Promise.all(
			owners.map((owner) =>
				sendClientUploadEmail({
					to: owner.email,
					uploaderName: actor.name,
					uploaderEmail: actor.email,
					clientName: company.name,
					documentNames: names.sort((a, b) => a.localeCompare(b)),
					url: `${process.env.NEXT_PUBLIC_APP_URL}${path}`,
				}).catch((error) =>
					console.error("Client upload notification failed:", error),
				),
			),
		);
	}
}

/** A short-lived link to preview (inline) or download (attachment) a file. */
export async function getFileUrl(
	actor: Actor,
	id: string,
	mode: "view" | "download",
) {
	const doc = await findDocument(id);
	if (!(await canAccessDocument(actor, doc, mode))) {
		throw new ForbiddenError();
	}

	await logActivity({
		actorId: actor.id,
		action: mode === "view" ? "document.view" : "document.download",
		documentId: id,
		clientId: doc.clientId,
		metadata: { name: doc.name },
	});
	return getDownloadUrl(
		doc.storageKey,
		doc.name,
		mode === "view" ? "inline" : "attachment",
	);
}

export async function renameDocument(actor: Actor, id: string, name: string) {
	const doc = await findDocument(id);
	if (!canRenameDocument(actor, doc)) throw new ForbiddenError();
	const newName = name.trim().slice(0, 255);
	if (!newName) throw new DmsError("Name can't be empty.");

	await db.update(document).set({ name: newName }).where(eq(document.id, id));
	await logActivity({
		actorId: actor.id,
		action: "document.rename",
		documentId: id,
		clientId: doc.clientId,
		metadata: { from: doc.name, to: newName },
	});
}

export async function setVisibility(
	actor: Actor,
	id: string,
	visibility: "private" | "public",
) {
	assertCan(actor, "canShare");
	const doc = await findDocument(id);
	if (doc.visibility === visibility) return;

	await db.update(document).set({ visibility }).where(eq(document.id, id));
	await logActivity({
		actorId: actor.id,
		action: "document.visibility_change",
		documentId: id,
		clientId: doc.clientId,
		metadata: { name: doc.name, from: doc.visibility, to: visibility },
	});
}

/**
 * Removes the file from Spaces straight away. The database row is kept
 * (marked deleted) so the activity log still has something to point at.
 */
export async function deleteDocument(actor: Actor, id: string) {
	const doc = await findDocument(id);
	if (!canDeleteDocument(actor, doc)) throw new ForbiddenError();

	await deleteObject(doc.storageKey);
	await db
		.update(document)
		.set({ deletedAt: new Date() })
		.where(eq(document.id, id));
	await db
		.update(documentShare)
		.set({ status: "revoked" })
		.where(eq(documentShare.documentId, id));
	await logActivity({
		actorId: actor.id,
		action: "document.delete",
		documentId: id,
		clientId: doc.clientId,
		metadata: { name: doc.name },
	});
}

export async function listShares(actor: Actor, documentId: string) {
	assertCan(actor, "canShare");
	if (!isUuid(documentId)) return [];
	const shares = await db.query.documentShare.findMany({
		where: eq(documentShare.documentId, documentId),
		orderBy: desc(documentShare.createdAt),
		columns: { tokenHash: false },
	});
	const now = new Date();
	return shares.map((s) => ({
		...s,
		expired: s.status === "pending" && s.expiresAt < now,
	}));
}

/**
 * Emails someone a link to a document. They only get access once they open
 * the link and accept, like a Google Drive invite. Re-sharing with the same
 * email replaces the old invite.
 */
export async function shareDocument(
	actor: Actor,
	documentId: string,
	input: { email: string; access: "view" | "download" },
) {
	assertCan(actor, "canShare");
	const doc = await findDocument(documentId);
	const email = normalizeEmail(input.email);
	if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
		throw new DmsError("Enter a valid email address.");
	}
	if (email === normalizeEmail(actor.email)) {
		throw new DmsError("You can't share a document with yourself.");
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
		.insert(documentShare)
		.values({ documentId, email, ...values })
		.onConflictDoUpdate({
			target: [documentShare.documentId, documentShare.email],
			set: values,
		});

	await sendInviteEmail({
		kind: "share",
		to: email,
		inviterName: actor.name,
		inviterEmail: actor.email,
		documentName: doc.name,
		url: inviteUrl(token),
	});
	await logActivity({
		actorId: actor.id,
		action: "share.invite",
		documentId,
		clientId: doc.clientId,
		metadata: { name: doc.name, email, access: input.access },
	});
}

export async function revokeShare(actor: Actor, shareId: string) {
	assertCan(actor, "canShare");
	if (!isUuid(shareId)) throw new DmsError("Share not found.");
	const share = await db.query.documentShare.findFirst({
		where: eq(documentShare.id, shareId),
		with: { document: true },
	});
	if (!share) throw new DmsError("Share not found.");

	await db
		.update(documentShare)
		.set({ status: "revoked" })
		.where(eq(documentShare.id, shareId));
	await logActivity({
		actorId: actor.id,
		action: "share.revoke",
		documentId: share.documentId,
		clientId: share.document.clientId,
		metadata: { name: share.document.name, email: share.email },
	});
}
