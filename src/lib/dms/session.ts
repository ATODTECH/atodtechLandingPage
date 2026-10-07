import "server-only";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { loadActor, type Actor } from "@/lib/dms/permissions";

/** Returns the signed-in actor, or null. */
export async function getActor(): Promise<Actor | null> {
	// headers() keeps the cookies the request arrived with, but cookies() also
	// reflects any a Server Action just set (e.g. the fresh session issued when
	// a password change signs out other devices). Without this, the re-render
	// after that action would see the old, deleted session.
	const requestHeaders = new Headers(await headers());
	requestHeaders.set("cookie", (await cookies()).toString());

	const session = await auth.api.getSession({ headers: requestHeaders });
	if (!session) return null;
	return loadActor(session.user);
}

/** For pages and actions that need a signed-in user. */
export async function requireActor(): Promise<Actor> {
	const actor = await getActor();
	if (!actor) redirect("/portal/sign-in");
	return actor;
}
