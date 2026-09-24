import "server-only";
import { randomUUID } from "node:crypto";
import { and, desc, eq, ilike, isNotNull, isNull, or } from "drizzle-orm";
import { db } from "@/lib/db";
import {
	client,
	document,
	documentShare,
	user,
} from "@/lib/db/schema";
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
import { isUuid } from "@/lib/dms/format";
import { inviteUrl } from "@/lib/dms/invites";
import {
	assertCan,
	canAccessDocument,
	isStaff,
	type Actor,
} from "@/lib/dms/permissions";
import { generateToken, INVITE_TTL_MS, normalizeEmail } from "@/lib/dms/tokens";

export const MAX_UPLOAD_BYTES = 100 * 1024 * 1024;

export const ALLOWED_MIME_TYPES = [
	"application/pdf",
	"image/png",
	"image/jpeg",
	"image/gif",
	"image/webp",
	"image/svg+xml",
	"text/plain",
	"text/csv",
	"text/markdown",
	"application/json",
	"application/zip",
	"application/msword",
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
	"application/vnd.ms-excel",
	"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	"application/vnd.ms-powerpoint",
	"application/vnd.openxmlformats-officedocument.presentationml.presentation",
	"video/mp4",
	"video/webm",
	"audio/mpeg",
];

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
	canDownload: boolean;
};

/**
 * Documents the actor can see. Staff see everything; clients see public
 * documents plus ones shared with them that they've accepted.
 */
export async function listDocuments(
	actor: Actor,
	filters: { clientId?: string; query?: string } = {},
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
				eq(document.status, "ready"),
				isNull(document.deletedAt),
				isUuid(filters.clientId)
					? eq(document.clientId, filters.clientId)
					: undefined,
				filters.query
					? ilike(document.name, `%${filters.query.replace(/[\\%_]/g, "\\$&")}%`)
					: undefined,
				staff
					? undefined
					: or(eq(document.visibility, "public"), isNotNull(documentShare.id)),
			),
		)
		.orderBy(desc(document.createdAt));

	return rows.map(({ shareAccess, ...row }) => ({
		...row,
		canDownload:
			staff || row.visibility === "public" || shareAccess === "download",
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
	};
}

/**
 * Step 1 of an upload: records a pending document and returns a short-lived
 * URL the browser PUTs the file to directly, so files never pass through
 * the Next.js server.
 */
export async function requestUpload(
	actor: Actor,
	input: {
		clientId: string;
		fileName: string;
		mimeType: string;
		sizeBytes: number;
	},
) {
	assertCan(actor, "canUpload");

	const mimeType = input.mimeType || "application/octet-stream";
	if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
		throw new DmsError(`Files of type "${mimeType}" can't be uploaded.`);
	}
	if (input.sizeBytes <= 0 || input.sizeBytes > MAX_UPLOAD_BYTES) {
		throw new DmsError("Files must be between 1 byte and 100 MB.");
	}
	const owner = isUuid(input.clientId)
		? await db.query.client.findFirst({ where: eq(client.id, input.clientId) })
		: undefined;
	if (!owner) throw new DmsError("Choose a client for this document.");

	const id = randomUUID();
	const name = input.fileName.trim().slice(0, 255) || "Untitled";
	const storageKey = buildStorageKey(owner.id, id, name);

	await db.insert(document).values({
		id,
		clientId: owner.id,
		name,
		storageKey,
		mimeType,
		sizeBytes: input.sizeBytes,
		uploadedBy: actor.id,
	});

	return { documentId: id, uploadUrl: await getUploadUrl(storageKey, mimeType) };
}

/** Step 2 of an upload: checks the file reached Spaces, then publishes it. */
export async function confirmUpload(actor: Actor, id: string) {
	assertCan(actor, "canUpload");

	const doc = isUuid(id)
		? await db.query.document.findFirst({
				where: and(eq(document.id, id), eq(document.status, "pending")),
			})
		: undefined;
	if (!doc) throw new DmsError("Upload not found.");

	const head = await headObject(doc.storageKey);
	if (!head) throw new DmsError("The file didn't finish uploading. Try again.");
	if (head.size !== doc.sizeBytes) {
		await deleteObject(doc.storageKey);
		throw new DmsError("The uploaded file was incomplete. Try again.");
	}

	await db
		.update(document)
		.set({ status: "ready" })
		.where(eq(document.id, id));
	await logActivity({
		actorId: actor.id,
		action: "document.upload",
		documentId: id,
		clientId: doc.clientId,
		metadata: { name: doc.name, sizeBytes: doc.sizeBytes },
	});
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
	assertCan(actor, "canUpload");
	const doc = await findDocument(id);
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
	assertCan(actor, "canDelete");
	const doc = await findDocument(id);

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
