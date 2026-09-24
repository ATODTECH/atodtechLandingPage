/**
 * Creates the DMS owner account for DMS_OWNER_EMAIL. Sign-up is invite-only,
 * so this is the only way the first account gets created.
 *
 *   npm run dms:create-owner
 */
import { loadEnvConfig } from "@next/env";
import { createInterface } from "node:readline";

loadEnvConfig(process.cwd());

const rl = createInterface({ input: process.stdin, output: process.stdout });
let muted = false;
// Echo nothing while a password is typed.
(rl as unknown as { _writeToOutput: (s: string) => void })._writeToOutput = (
	s,
) => {
	if (!muted) process.stdout.write(s);
};

// Buffers lines as they arrive, so pasted or piped answers aren't lost.
const lines = rl[Symbol.asyncIterator]();

async function ask(question: string, hidden = false): Promise<string> {
	process.stdout.write(question);
	muted = hidden;
	const { value, done } = await lines.next();
	muted = false;
	if (hidden) process.stdout.write("\n");
	if (done) throw new Error("Cancelled.");
	return value.trim();
}

async function main() {
	const email = process.env.DMS_OWNER_EMAIL?.trim().toLowerCase();
	if (!email) throw new Error("Set DMS_OWNER_EMAIL in .env.local first.");

	// Imported after env is loaded, since they read it at import time.
	const { eq } = await import("drizzle-orm");
	const { auth } = await import("@/lib/auth");
	const { db } = await import("@/lib/db");
	const { user } = await import("@/lib/db/schema");

	const existing = await db.query.user.findFirst({
		where: eq(user.email, email),
	});
	if (existing) {
		console.log(`An account for ${email} already exists (role: ${existing.role}).`);
		return;
	}

	console.log(`Creating the owner account for ${email}`);
	const name = await ask("Name: ");
	const password = await ask("Password (min 8 characters): ", true);
	if (password.length < 8) throw new Error("Password must be at least 8 characters.");
	if ((await ask("Confirm password: ", true)) !== password) {
		throw new Error("Passwords don't match.");
	}

	const { user: owner } = await auth.api.signUpEmail({
		body: { email, name: name || "Owner", password },
	});
	console.log(`Done. ${owner.email} is the owner (role: ${owner.role}).`);
}

main()
	.catch((error) => {
		console.error(error instanceof Error ? error.message : error);
		process.exitCode = 1;
	})
	.finally(() => {
		rl.close();
		process.exit();
	});
