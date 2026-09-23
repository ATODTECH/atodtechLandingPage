import { NextResponse, type NextRequest } from "next/server";
import { getFileUrl } from "@/lib/dms/documents";
import { DmsError } from "@/lib/dms/errors";
import { getActor } from "@/lib/dms/session";

/**
 * Checks access, logs the view/download, then redirects to a 60-second
 * signed Spaces URL. Used directly as an <iframe>/<img> src or download link.
 */
export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const actor = await getActor();
	if (!actor) {
		return NextResponse.redirect(new URL("/portal/sign-in", request.url));
	}

	const { id } = await params;
	const mode =
		request.nextUrl.searchParams.get("mode") === "download" ? "download" : "view";

	try {
		const url = await getFileUrl(actor, id, mode);
		return NextResponse.redirect(url, {
			headers: { "Cache-Control": "no-store" },
		});
	} catch (error) {
		if (error instanceof DmsError) {
			return new NextResponse(error.message, { status: 404 });
		}
		throw error;
	}
}
