import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
	adminPermission,
	documentShare,
	type AdminRights,
	type document,
} from "@/lib/db/schema";
import type { UserRole } from "@/lib/auth";

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
};

export async function loadActor(sessionUser: {
	id: string;
	email: string;
	name: string;
	role?: string | null;
}): Promise<Actor> {
	const role = (sessionUser.role ?? "client") as UserRole;
	let rights = NO_RIGHTS;

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
	}

	return {
		id: sessionUser.id,
		email: sessionUser.email,
		name: sessionUser.name,
		role,
		rights,
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
	"id" | "visibility" | "status" | "deletedAt"
>;

/**
 * Can this actor view or download a document?
 * - Staff (owner and admins) can see every document.
 * - Clients can see public documents, or ones shared with them and accepted.
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

export class ForbiddenError extends Error {
	constructor(message = "You don't have permission to do that.") {
		super(message);
		this.name = "ForbiddenError";
	}
}

export function assertCan(actor: Actor, right: AdminRight) {
	if (!can(actor, right)) throw new ForbiddenError();
}
