import { and, eq, inArray, isNotNull, isNull, or, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import {
	adminPermission,
	clientMember,
	document,
	documentShare,
	folder,
	folderShare,
	type AdminRights,
} from "@/lib/db/schema";
import type { UserRole } from "@/lib/auth";
import { ForbiddenError } from "@/lib/dms/errors";

export type AdminRight = keyof AdminRights;

export const NO_RIGHTS: AdminRights = {
	canUpload: false,
	canDelete: false,
	canShare: false,
	canManageClients: false,
	canManageAdmins: false,
	canViewActivity: false,
};

export const ALL_RIGHTS: AdminRights = {
	canUpload: true,
	canDelete: true,
	canShare: true,
	canManageClients: true,
	canManageAdmins: true,
	canViewActivity: true,
};

/** The signed-in user plus everything needed to make permission decisions. */
export type Actor = {
	id: string;
	email: string;
	name: string;
	role: UserRole;
	rights: AdminRights;
	/** Client companies a client user belongs to. Empty for staff. */
	clientIds: string[];
	/**
	 * Folders a client user can reach through accepted folder shares, with the
	 * subfolders below them, and the best access they have to each. Empty for staff.
	 */
	folderAccess: Record<string, ShareAccess>;
};

type ShareAccess = "view" | "download";

export async function loadActor(sessionUser: {
	id: string;
	email: string;
	name: string;
	role?: string | null;
}): Promise<Actor> {
	const role = (sessionUser.role ?? "client") as UserRole;
	let rights = NO_RIGHTS;
	let clientIds: string[] = [];
	let folderAccess: Record<string, ShareAccess> = {};

	if (role === "owner") {
		rights = ALL_RIGHTS;
	} else if (role === "admin") {
		const row = await db.query.adminPermission.findFirst({
			where: eq(adminPermission.userId, sessionUser.id),
		});
		if (row) {
			rights = {
				canUpload: row.canUpload,
				canDelete: row.canDelete,
				canShare: row.canShare,
				canManageClients: row.canManageClients,
				canManageAdmins: row.canManageAdmins,
				canViewActivity: row.canViewActivity,
			};
		}
	} else {
		const memberships = await db
			.select({ clientId: clientMember.clientId })
			.from(clientMember)
			.where(eq(clientMember.userId, sessionUser.id));
		clientIds = memberships.map((m) => m.clientId);
		folderAccess = await loadFolderAccess(sessionUser.id);
	}

	return {
		id: sessionUser.id,
		email: sessionUser.email,
		name: sessionUser.name,
		role,
		rights,
		clientIds,
		folderAccess,
	};
}

/** Shared folders and everything below them, with the best access to each. */
async function loadFolderAccess(userId: string) {
	const shares = await db
		.select({
			folderId: folderShare.folderId,
			access: folderShare.access,
			clientId: folder.clientId,
		})
		.from(folderShare)
		.innerJoin(folder, eq(folder.id, folderShare.folderId))
		.where(and(eq(folderShare.userId, userId), eq(folderShare.status, "accepted")));
	const access: Record<string, ShareAccess> = {};
	if (shares.length === 0) return access;

	const folders = await db
		.select({ id: folder.id, parentId: folder.parentId })
		.from(folder)
		.where(inArray(folder.clientId, [...new Set(shares.map((s) => s.clientId))]));
	const children = new Map<string, string[]>();
	for (const f of folders) {
		if (!f.parentId) continue;
		children.set(f.parentId, [...(children.get(f.parentId) ?? []), f.id]);
	}

	// Download shares first, so a view share never downgrades a folder.
	shares.sort((a, b) => Number(b.access === "download") - Number(a.access === "download"));
	for (const share of shares) {
		const stack = [share.folderId];
		while (stack.length > 0) {
			const id = stack.pop()!;
			if (access[id]) continue;
			access[id] = share.access;
			stack.push(...(children.get(id) ?? []));
		}
	}
	return access;
}
export function isStaff(actor: Actor) {
	return actor.role === "owner" || actor.role === "admin";
}

/** Clients never get admin rights, whatever the database says. */
export function can(actor: Actor, right: AdminRight) {
	return isStaff(actor) && actor.rights[right];
}

type DocumentRow = Pick<
	typeof document.$inferSelect,
	| "id"
	| "clientId"
	| "visibility"
	| "status"
	| "deletedAt"
	| "uploadedBy"
	| "uploadedByClient"
	| "folderId"
>;

/** Whether the actor is a member of this client company. */
export function isMemberOf(actor: Actor, clientId: string) {
	return actor.role === "client" && actor.clientIds.includes(clientId);
}

/**
 * Can this actor view or download a document?
 * - Staff (owner and admins) can see every document.
 * - Clients can see public documents, ones shared with them and accepted,
 *   and anything uploaded by a client of a company they belong to (their
 *   company's shared folder). Staff uploads to that company stay private
 *   unless shared or made public.
 *   Documents in a folder shared with them (or below it) count as shared.
 *   Downloading a shared document needs "download" access on the share.
 */
export async function canAccessDocument(
	actor: Actor,
	doc: DocumentRow,
	action: "view" | "download",
) {
	if (doc.deletedAt || doc.status !== "ready") return false;
	if (isStaff(actor)) return true;
	if (doc.visibility === "public") return true;
	if (doc.uploadedByClient && isMemberOf(actor, doc.clientId)) return true;
	const viaFolder = doc.folderId ? actor.folderAccess[doc.folderId] : undefined;
	if (viaFolder === "download" || (viaFolder && action === "view")) return true;

	const share = await db.query.documentShare.findFirst({
		where: and(
			eq(documentShare.documentId, doc.id),
			eq(documentShare.userId, actor.id),
			eq(documentShare.status, "accepted"),
		),
	});
	if (!share) return false;
	return action === "view" || share.access === "download";
}

/**
 * The same rules as `canAccessDocument(…, "view")`, as a query condition for
 * listing. The query must left join documentShare on the actor's accepted share.
 */
export function visibleDocuments(actor: Actor) {
	return and(
		eq(document.status, "ready"),
		isNull(document.deletedAt),
		isStaff(actor)
			? undefined
			: or(
					eq(document.visibility, "public"),
					isNotNull(documentShare.id),
					companyUploads(actor),
					inFolders(Object.keys(actor.folderAccess)),
				),
	);
}

/**
 * The same rules as `canAccessDocument(…, "download")`, on top of
 * `visibleDocuments`. Undefined for staff, who can download everything.
 */
export function downloadableDocuments(actor: Actor): SQL | undefined {
	if (isStaff(actor)) return undefined;
	return or(
		eq(document.visibility, "public"),
		eq(documentShare.access, "download"),
		companyUploads(actor),
		inFolders(
			Object.entries(actor.folderAccess)
				.filter(([, access]) => access === "download")
				.map(([id]) => id),
		),
	);
}

/** What other people at the actor's companies uploaded. */
function companyUploads(actor: Actor) {
	return actor.clientIds.length > 0
		? and(
				eq(document.uploadedByClient, true),
				inArray(document.clientId, actor.clientIds),
			)
		: undefined;
}

function inFolders(folderIds: string[]) {
	return folderIds.length > 0 ? inArray(document.folderId, folderIds) : undefined;
}

/** Staff with the upload right can upload anywhere; clients only to their companies. */
export function canUploadTo(actor: Actor, clientId: string) {
	return can(actor, "canUpload") || isMemberOf(actor, clientId);
}

/** A client's own upload, which they may rename and delete. */
function isOwnClientUpload(actor: Actor, doc: DocumentRow) {
	return (
		actor.role === "client" &&
		doc.uploadedByClient &&
		doc.uploadedBy === actor.id &&
		isMemberOf(actor, doc.clientId)
	);
}

export function canRenameDocument(actor: Actor, doc: DocumentRow) {
	return can(actor, "canUpload") || isOwnClientUpload(actor, doc);
}

export function canDeleteDocument(actor: Actor, doc: DocumentRow) {
	return can(actor, "canDelete") || isOwnClientUpload(actor, doc);
}

export function assertCan(actor: Actor, right: AdminRight) {
	if (!can(actor, right)) throw new ForbiddenError();
}
