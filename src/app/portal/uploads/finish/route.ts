import { finishUploads } from "@/lib/dms/documents";
import { getActor } from "@/lib/dms/session";

/**
 * Called with navigator.sendBeacon when someone leaves the page mid-upload
 * (a Server Action would be cancelled), so owners still hear about the files
 * that made it.
 */
export async function POST() {
	const actor = await getActor();
	if (!actor) return new Response(null, { status: 401 });
	await finishUploads(actor);
	return new Response(null, { status: 204 });
}
