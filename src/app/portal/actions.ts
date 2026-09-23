"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { APIError } from "better-auth/api";
import { auth } from "@/lib/auth";
import type { AdminRights } from "@/lib/db/schema";
import * as clients from "@/lib/dms/clients";
import * as documents from "@/lib/dms/documents";
import { DmsError } from "@/lib/dms/errors";
import * as invites from "@/lib/dms/invites";
import { getActor, requireActor } from "@/lib/dms/session";
import * as team from "@/lib/dms/team";

export type ActionResult<T = void> =
	| { ok: true; data: T }
	| { ok: false; error: string };

/** Turns thrown errors into a message the UI can show. */
async function run<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
	try {
		return { ok: true, data: await fn() };
	} catch (error) {
		if (error instanceof DmsError) return { ok: false, error: error.message };
		if (error instanceof APIError) {
			return { ok: false, error: error.body?.message ?? error.message };
		}
		// Let Next.js redirects (e.g. signed out) through.
		if ((error as { digest?: string })?.digest?.startsWith("NEXT_REDIRECT")) {
			throw error;
		}
		console.error(error);
		return { ok: false, error: "Something went wrong. Please try again." };
	}
}

// Documents

export async function requestUploadAction(input: {
	clientId: string;
	fileName: string;
	mimeType: string;
	sizeBytes: number;
}) {
	return run(async () => documents.requestUpload(await requireActor(), input));
}

export async function confirmUploadAction(documentId: string) {
	return run(async () => {
		await documents.confirmUpload(await requireActor(), documentId);
		revalidatePath("/portal");
	});
}

export async function renameDocumentAction(documentId: string, name: string) {
	return run(async () => {
		await documents.renameDocument(await requireActor(), documentId, name);
		revalidatePath("/portal", "layout");
	});
}

export async function setVisibilityAction(
	documentId: string,
	visibility: "private" | "public",
) {
	return run(async () => {
		await documents.setVisibility(await requireActor(), documentId, visibility);
		revalidatePath("/portal", "layout");
	});
}

export async function deleteDocumentAction(documentId: string) {
	return run(async () => {
		await documents.deleteDocument(await requireActor(), documentId);
		revalidatePath("/portal", "layout");
	});
}

export async function shareDocumentAction(
	documentId: string,
	input: { email: string; access: "view" | "download" },
) {
	return run(async () => {
		await documents.shareDocument(await requireActor(), documentId, input);
		revalidatePath(`/portal/documents/${documentId}`);
	});
}

export async function revokeShareAction(shareId: string, documentId: string) {
	return run(async () => {
		await documents.revokeShare(await requireActor(), shareId);
		revalidatePath(`/portal/documents/${documentId}`);
	});
}

// Clients

export async function createClientAction(name: string) {
	return run(async () => {
		const row = await clients.createClient(await requireActor(), name);
		revalidatePath("/portal", "layout");
		return { id: row.id, name: row.name };
	});
}

export async function renameClientAction(id: string, name: string) {
	return run(async () => {
		await clients.renameClient(await requireActor(), id, name);
		revalidatePath("/portal", "layout");
	});
}

export async function deleteClientAction(id: string) {
	return run(async () => {
		await clients.deleteClient(await requireActor(), id);
		revalidatePath("/portal", "layout");
	});
}

// Team

export async function inviteUserAction(input: {
	email: string;
	role: "admin" | "client";
	adminRights?: AdminRights;
}) {
	return run(async () => {
		await invites.createUserInvite(await requireActor(), input);
		revalidatePath("/portal/team");
	});
}

export async function revokeInviteAction(inviteId: string) {
	return run(async () => {
		await invites.revokeUserInvite(await requireActor(), inviteId);
		revalidatePath("/portal/team");
	});
}

export async function setAdminRightsAction(userId: string, rights: AdminRights) {
	return run(async () => {
		await team.setAdminRights(await requireActor(), userId, rights);
		revalidatePath("/portal/team");
	});
}

export async function removeAdminAction(userId: string) {
	return run(async () => {
		await team.removeAdmin(await requireActor(), userId);
		revalidatePath("/portal/team");
	});
}

// Invites & auth

export async function acceptInviteAction(
	token: string,
	input?: { name: string; password: string },
) {
	const result = await run(async () => {
		const actor = await getActor();
		if (actor) return invites.acceptInviteAsExistingUser(token, actor);
		if (!input) throw new DmsError("Sign in to accept this invite.");
		if (input.password.length < 8) {
			throw new DmsError("Password must be at least 8 characters.");
		}
		return invites.acceptInviteAsNewUser(token, input);
	});
	if (!result.ok) return result;
	redirect(
		result.data.kind === "share"
			? `/portal/documents/${result.data.documentId}`
			: "/portal",
	);
}

export async function signOutAction() {
	await auth.api.signOut({ headers: await headers() });
	redirect("/portal/sign-in");
}
