import "server-only";
import { and, asc, desc, eq, gt } from "drizzle-orm";
import { db } from "@/lib/db";
import {
	adminPermission,
	user,
	userInvite,
	type AdminRights,
} from "@/lib/db/schema";
import { logActivity } from "@/lib/dms/activity";
import { DmsError, ForbiddenError } from "@/lib/dms/errors";
import {
	assertCan,
	NO_RIGHTS,
	type Actor,
	type AdminRight,
} from "@/lib/dms/permissions";

/** Everyone with an account, plus open invites. */
export async function listTeam(actor: Actor) {
	assertCan(actor, "canManageAdmins");

	const [users, invites] = await Promise.all([
		db
			.select({
				id: user.id,
				name: user.name,
				email: user.email,
				role: user.role,
				createdAt: user.createdAt,
				rights: {
					canUpload: adminPermission.canUpload,
					canDelete: adminPermission.canDelete,
					canShare: adminPermission.canShare,
					canManageClients: adminPermission.canManageClients,
					canManageAdmins: adminPermission.canManageAdmins,
					canViewActivity: adminPermission.canViewActivity,
				},
			})
			.from(user)
			.leftJoin(adminPermission, eq(adminPermission.userId, user.id))
			.orderBy(asc(user.createdAt)),
		db.query.userInvite.findMany({
			where: and(
				eq(userInvite.status, "pending"),
				gt(userInvite.expiresAt, new Date()),
			),
			orderBy: desc(userInvite.createdAt),
			columns: { tokenHash: false },
		}),
	]);

	return {
		users: users.map((u) => ({ ...u, rights: u.rights ?? NO_RIGHTS })),
		invites,
	};
}

/**
 * Guards against privilege escalation: admins can't edit themselves or the
 * owner, and can only hand out rights they hold themselves.
 */
async function assertCanManage(actor: Actor, targetId: string) {
	assertCan(actor, "canManageAdmins");
	if (targetId === actor.id) {
		throw new ForbiddenError("You can't change your own access.");
	}
	const target = await db.query.user.findFirst({ where: eq(user.id, targetId) });
	if (!target) throw new DmsError("User not found.");
	if (target.role === "owner") {
		throw new ForbiddenError("The owner's access can't be changed.");
	}
	return target;
}

function assertGrantable(actor: Actor, rights: AdminRights) {
	for (const [right, granted] of Object.entries(rights)) {
		if (granted && !actor.rights[right as AdminRight]) {
			throw new ForbiddenError("You can only grant rights you have yourself.");
		}
	}
}

/** Makes someone an admin (or updates an admin's rights). */
export async function setAdminRights(
	actor: Actor,
	userId: string,
	rights: AdminRights,
) {
	const target = await assertCanManage(actor, userId);
	assertGrantable(actor, rights);

	await db.transaction(async (tx) => {
		await tx.update(user).set({ role: "admin" }).where(eq(user.id, userId));
		await tx
			.insert(adminPermission)
			.values({ userId, ...rights, updatedBy: actor.id })
			.onConflictDoUpdate({
				target: adminPermission.userId,
				set: { ...rights, updatedBy: actor.id },
			});
	});
	await logActivity({
		actorId: actor.id,
		action: target.role === "admin" ? "admin.update_permissions" : "admin.add",
		targetUserId: userId,
		metadata: { email: target.email, rights },
	});
}

/** Turns an admin back into a client with view/download access only. */
export async function removeAdmin(actor: Actor, userId: string) {
	const target = await assertCanManage(actor, userId);
	if (target.role !== "admin") throw new DmsError("That user isn't an admin.");

	await db.transaction(async (tx) => {
		await tx.update(user).set({ role: "client" }).where(eq(user.id, userId));
		await tx.delete(adminPermission).where(eq(adminPermission.userId, userId));
	});
	await logActivity({
		actorId: actor.id,
		action: "admin.remove",
		targetUserId: userId,
		metadata: { email: target.email },
	});
}
