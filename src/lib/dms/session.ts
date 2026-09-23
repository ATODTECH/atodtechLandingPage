import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { loadActor, type Actor } from "@/lib/dms/permissions";

/** Returns the signed-in actor, or null. */
export async function getActor(): Promise<Actor | null> {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session) return null;
	return loadActor(session.user);
}

/** For pages and actions that need a signed-in user. */
export async function requireActor(): Promise<Actor> {
	const actor = await getActor();
	if (!actor) redirect("/sign-in");
	return actor;
}
