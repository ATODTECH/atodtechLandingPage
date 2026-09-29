import "server-only";
import { and, asc, desc, eq, gt, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
	adminPermission,
	client,
	clientMember,
	documentShare,
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

	const [users, invites, memberships] = await Promise.all([
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
			with: { client: { columns: { name: true } } },
		}),
		db
			.select({
				userId: clientMember.userId,
				clientId: client.id,
				clientName: client.name,
			})
			.from(clientMember)
			.innerJoin(client, eq(client.id, clientMember.clientId))
			.orderBy(asc(client.name)),
	]);

	return {
		users: users.map((u) => ({
			...u,
			rights: u.rights ?? NO_RIGHTS,
			clients: memberships
				.filter((m) => m.userId === u.id)
				.map((m) => ({ id: m.clientId, name: m.clientName })),
		})),
		invites: invites.map(({ client: company, ...i }) => ({
			...i,
			clientName: company?.name ?? null,
		})),
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

/**
 * Deletes an admin or client entirely. Owner only. Their sessions, sign-in
 * details, admin rights and document access go with the account, and any
 * open invites to their email are cancelled, so they can be invited again
 * from scratch later. Activity log entries stay, shown as "Deleted user".
 */
export async function removeUser(actor: Actor, userId: string) {
	if (actor.role !== "owner") {
		throw new ForbiddenError("Only the owner can remove people.");
	}
	if (userId === actor.id) {
		throw new ForbiddenError("You can't remove yourself.");
	}
	const target = await db.query.user.findFirst({ where: eq(user.id, userId) });
	if (!target) throw new DmsError("User not found.");
	if (target.role === "owner") {
		throw new ForbiddenError("The owner can't be removed.");
	}

	// Logged first: the entry keeps their name and email after the row is gone.
	await logActivity({
		actorId: actor.id,
		action: "user.remove",
		metadata: { email: target.email, name: target.name, role: target.role },
	});

	await db.transaction(async (tx) => {
		// Old invite links to their email must stop working.
		await tx
			.update(userInvite)
			.set({ status: "revoked" })
			.where(
				and(eq(userInvite.email, target.email), eq(userInvite.status, "pending")),
			);
		// Shares still waiting for them to accept (accepted ones cascade below).
		await tx
			.delete(documentShare)
			.where(eq(documentShare.email, target.email));
		// Cascades to sessions (signing them out), accounts and admin rights.
		await tx.delete(user).where(eq(user.id, userId));
	});
}

/**
 * Sets which client companies a client user belongs to. Membership gives
 * them that company's shared folder: they can upload there and see what
 * other people at the company upload.
 */
export async function setClientMemberships(
	actor: Actor,
	userId: string,
	clientIds: string[],
) {
	assertCan(actor, "canManageAdmins");
	const target = await db.query.user.findFirst({ where: eq(user.id, userId) });
	if (!target) throw new DmsError("User not found.");
	if (target.role !== "client") {
		throw new DmsError("Only client accounts belong to client companies.");
	}

	const wanted = [...new Set(clientIds)];
	const companies = wanted.length
		? await db.select().from(client).where(inArray(client.id, wanted))
		: [];
	if (companies.length !== wanted.length) throw new DmsError("Client not found.");

	const current = await db
		.select({ clientId: clientMember.clientId, name: client.name })
		.from(clientMember)
		.innerJoin(client, eq(client.id, clientMember.clientId))
		.where(eq(clientMember.userId, userId));
	const added = companies.filter((c) => !current.some((m) => m.clientId === c.id));
	const removed = current.filter((m) => !wanted.includes(m.clientId));
	if (added.length === 0 && removed.length === 0) return;

	await db.transaction(async (tx) => {
		if (added.length) {
			await tx
				.insert(clientMember)
				.values(added.map((c) => ({ userId, clientId: c.id })))
				.onConflictDoNothing();
		}
		if (removed.length) {
			await tx.delete(clientMember).where(
				and(
					eq(clientMember.userId, userId),
					inArray(
						clientMember.clientId,
						removed.map((m) => m.clientId),
					),
				),
			);
		}
	});

	for (const c of added) {
		await logActivity({
			actorId: actor.id,
			action: "client.member_add",
			clientId: c.id,
			targetUserId: userId,
			metadata: { email: target.email, client: c.name },
		});
	}
	for (const m of removed) {
		await logActivity({
			actorId: actor.id,
			action: "client.member_remove",
			clientId: m.clientId,
			targetUserId: userId,
			metadata: { email: target.email, client: m.name },
		});
	}
}
