import "server-only";
import { and, eq, gt } from "drizzle-orm";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
	adminPermission,
	documentShare,
	user,
	userInvite,
	type AdminRights,
} from "@/lib/db/schema";
import { sendInviteEmail } from "@/lib/email/invite-email";
import { logActivity } from "@/lib/dms/activity";
import { DmsError, ForbiddenError } from "@/lib/dms/errors";
import { isUuid } from "@/lib/dms/format";
import { assertCan, NO_RIGHTS, type Actor } from "@/lib/dms/permissions";
import {
	generateToken,
	hashToken,
	INVITE_TTL_MS,
	normalizeEmail,
} from "@/lib/dms/tokens";

export function inviteUrl(token: string) {
	return `${process.env.NEXT_PUBLIC_APP_URL}/portal/invite/${token}`;
}

/** Invite someone to create an account, as an admin or a client. */
export async function createUserInvite(
	actor: Actor,
	input: { email: string; role: "admin" | "client"; adminRights?: AdminRights },
) {
	assertCan(actor, input.role === "admin" ? "canManageAdmins" : "canShare");

	const email = normalizeEmail(input.email);
	const existing = await db.query.user.findFirst({
		where: eq(user.email, email),
	});
	if (existing && (existing.role !== "client" || input.role === "client")) {
		throw new DmsError("That person already has an account.");
	}

	// Only one open invite per email: revoke any older ones.
	await db
		.update(userInvite)
		.set({ status: "revoked" })
		.where(and(eq(userInvite.email, email), eq(userInvite.status, "pending")));

	const { token, tokenHash } = generateToken();
	const [invite] = await db
		.insert(userInvite)
		.values({
			email,
			role: input.role,
			adminRights: input.role === "admin" ? (input.adminRights ?? NO_RIGHTS) : null,
			tokenHash,
			invitedBy: actor.id,
			expiresAt: new Date(Date.now() + INVITE_TTL_MS),
		})
		.returning();

	await sendInviteEmail({
		to: email,
		inviterName: actor.name,
		kind: input.role === "admin" ? "admin" : "account",
		url: inviteUrl(token),
	});
	await logActivity({
		actorId: actor.id,
		action: "user.invite",
		metadata: { email, role: input.role, inviteId: invite.id },
	});

	return invite;
}

export async function revokeUserInvite(actor: Actor, inviteId: string) {
	const invite = isUuid(inviteId)
		? await db.query.userInvite.findFirst({ where: eq(userInvite.id, inviteId) })
		: undefined;
	if (!invite) throw new DmsError("Invite not found.");
	assertCan(actor, invite.role === "admin" ? "canManageAdmins" : "canShare");

	await db
		.update(userInvite)
		.set({ status: "revoked" })
		.where(eq(userInvite.id, inviteId));
	await logActivity({
		actorId: actor.id,
		action: "user.invite_revoke",
		metadata: { email: invite.email, inviteId },
	});
}

export type ResolvedInvite =
	| { kind: "account"; email: string; role: "admin" | "client"; id: string }
	| {
			kind: "share";
			email: string;
			id: string;
			documentId: string;
			documentName: string;
	  };

/** Looks up an open, unexpired invite by its raw token. */
export async function resolveInvite(
	token: string,
): Promise<ResolvedInvite | null> {
	const tokenHash = hashToken(token);
	const now = new Date();

	const invite = await db.query.userInvite.findFirst({
		where: and(
			eq(userInvite.tokenHash, tokenHash),
			eq(userInvite.status, "pending"),
			gt(userInvite.expiresAt, now),
		),
	});
	if (invite) {
		return {
			kind: "account",
			email: invite.email,
			role: invite.role,
			id: invite.id,
		};
	}

	const share = await db.query.documentShare.findFirst({
		where: and(
			eq(documentShare.tokenHash, tokenHash),
			eq(documentShare.status, "pending"),
			gt(documentShare.expiresAt, now),
		),
		with: { document: true },
	});
	if (share && !share.document.deletedAt) {
		return {
			kind: "share",
			email: share.email,
			id: share.id,
			documentId: share.documentId,
			documentName: share.document.name,
		};
	}

	return null;
}

export async function hasAccount(email: string) {
	const existing = await db.query.user.findFirst({
		where: eq(user.email, normalizeEmail(email)),
		columns: { id: true },
	});
	return !!existing;
}

/**
 * Creates the account for an invite link and signs the new user in.
 * The email always comes from the invite, never from the form, so opening
 * the link proves the person owns that inbox.
 */
export async function acceptInviteAsNewUser(
	token: string,
	input: { name: string; password: string },
) {
	const invite = await resolveInvite(token);
	if (!invite) throw new DmsError("This invite is invalid or has expired.");
	if (await hasAccount(invite.email)) {
		throw new DmsError("An account already exists. Sign in to accept.");
	}

	const { user: newUser } = await auth.api.signUpEmail({
		body: { email: invite.email, name: input.name, password: input.password },
		headers: await headers(),
	});

	await markAccepted(invite, newUser.id);
	await logActivity({
		actorId: newUser.id,
		action: "user.join",
		metadata: { email: invite.email, via: invite.kind },
	});
	return invite;
}

/** Accepts an invite for someone who is already signed in. */
export async function acceptInviteAsExistingUser(token: string, actor: Actor) {
	const invite = await resolveInvite(token);
	if (!invite) throw new DmsError("This invite is invalid or has expired.");
	if (normalizeEmail(actor.email) !== invite.email) {
		throw new ForbiddenError(
			`This invite was sent to ${invite.email}. Sign in with that account to accept it.`,
		);
	}

	// Never touch the owner's role.
	if (invite.kind === "account" && invite.role === "admin" && actor.role === "owner") {
		throw new DmsError("The owner already has full access.");
	}

	await markAccepted(invite, actor.id);
	return invite;
}

async function markAccepted(invite: ResolvedInvite, userId: string) {
	const acceptedAt = new Date();

	await db.transaction(async (tx) => {
		if (invite.kind === "account") {
			const row = await tx
				.update(userInvite)
				.set({ status: "accepted", acceptedAt })
				.where(eq(userInvite.id, invite.id))
				.returning();

			if (invite.role === "admin") {
				// Also promotes an existing client who accepted an admin invite.
				await tx.update(user).set({ role: "admin" }).where(eq(user.id, userId));
				const rights = row[0]?.adminRights ?? NO_RIGHTS;
				await tx
					.insert(adminPermission)
					.values({ userId, ...rights, updatedBy: row[0]?.invitedBy })
					.onConflictDoUpdate({
						target: adminPermission.userId,
						set: { ...rights, updatedBy: row[0]?.invitedBy },
					});
			}
		}

		// Opening the link proved they own this email, so every open share
		// sent to it is accepted too, not just the one in this link.
		await tx
			.update(documentShare)
			.set({ status: "accepted", userId, acceptedAt })
			.where(
				and(
					eq(documentShare.email, invite.email),
					eq(documentShare.status, "pending"),
					gt(documentShare.expiresAt, acceptedAt),
				),
			);
	});

	if (invite.kind === "share") {
		await logActivity({
			actorId: userId,
			action: "share.accept",
			documentId: invite.documentId,
			metadata: { email: invite.email, documentName: invite.documentName },
		});
	}
}
