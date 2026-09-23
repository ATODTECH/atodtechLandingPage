import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";

export const USER_ROLES = ["owner", "admin", "client"] as const;
export type UserRole = (typeof USER_ROLES)[number];

/**
 * Sign-up is invite-only. Works out the role for a new account from its email:
 * the owner email, an open account invite, or an open document share.
 * Returns null when the email hasn't been invited.
 */
async function roleForNewUser(rawEmail: string): Promise<UserRole | null> {
	const email = rawEmail.trim().toLowerCase();
	const now = new Date();

	const ownerEmail = process.env.DMS_OWNER_EMAIL?.trim().toLowerCase();
	if (ownerEmail && email === ownerEmail) return "owner";

	const invite = await db.query.userInvite.findFirst({
		where: and(
			eq(schema.userInvite.email, email),
			eq(schema.userInvite.status, "pending"),
			gt(schema.userInvite.expiresAt, now),
		),
	});
	if (invite) return invite.role;

	const share = await db.query.documentShare.findFirst({
		where: and(
			eq(schema.documentShare.email, email),
			eq(schema.documentShare.status, "pending"),
			gt(schema.documentShare.expiresAt, now),
		),
	});
	if (share) return "client";

	return null;
}

export const auth = betterAuth({
	database: drizzleAdapter(db, { provider: "pg", schema }),
	emailAndPassword: {
		enabled: true,
	},
	// No public sign-up. Accounts are created server-side when an invite is
	// accepted (see src/lib/dms/invites.ts) or by `npm run dms:create-owner`.
	disabledPaths: ["/sign-up/email"],
	user: {
		additionalFields: {
			role: {
				type: "string",
				defaultValue: "client",
				// Users can't choose their own role at sign-up.
				input: false,
			},
		},
	},
	databaseHooks: {
		user: {
			create: {
				// Second line of defence: even server-side sign-ups need an invite.
				before: async (user) => {
					const role = await roleForNewUser(user.email);
					if (!role) {
						throw new APIError("FORBIDDEN", {
							message: "Sign-up is by invitation only.",
						});
					}
					return { data: { ...user, role } };
				},
			},
		},
	},
	// Must be the last plugin so Server Actions can set auth cookies.
	plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
