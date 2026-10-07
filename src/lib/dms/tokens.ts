import { createHash, randomBytes } from "node:crypto";

export const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** A URL-safe random token. Only its hash is stored; the raw value goes in the email. */
export function generateToken() {
	const token = randomBytes(32).toString("base64url");
	return { token, tokenHash: hashToken(token) };
}

export function hashToken(token: string) {
	return createHash("sha256").update(token).digest("hex");
}

export function normalizeEmail(email: string) {
	return email.trim().toLowerCase();
}
