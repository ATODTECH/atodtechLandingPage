import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
	adminPermission,
	clientMember,
	documentShare,
	type AdminRights,
	type document,
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
};

export async function loadActor(sessionUser: {
	id: string;
	email: string;
	name: string;
	role?: string | null;
}): Promise<Actor> {
	const role = (sessionUser.role ?? "client") as UserRole;
	let rights = NO_RIGHTS;
	let clientIds: string[] = [];

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
	}

	return {
		id: sessionUser.id,
		email: sessionUser.email,
		name: sessionUser.name,
		role,
		rights,
		clientIds,
	};
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
