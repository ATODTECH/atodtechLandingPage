import { NextResponse, type NextRequest } from "next/server";
import { downloadZip } from "client-zip";
import { DmsError } from "@/lib/dms/errors";
import { prepareFolderDownload, type FolderDownloadFile } from "@/lib/dms/folders";
import { getActor } from "@/lib/dms/session";
import { getObjectStream } from "@/lib/storage";

/**
 * Downloads a folder, with its subfolders, as one zip. The zip is built while
 * it streams, without compression (most project files are already compressed),
 * so nothing is held in memory and the download starts straight away.
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
	let folder: Awaited<ReturnType<typeof prepareFolderDownload>>;
	try {
		folder = await prepareFolderDownload(actor, id);
	} catch (error) {
		if (error instanceof DmsError) {
			return new NextResponse(error.message, { status: 404 });
		}
		throw error;
	}

	// Each file is fetched from Spaces only when the zip reaches it.
	async function* entries(files: FolderDownloadFile[]) {
		for (const file of files) {
			yield {
				name: file.path,
				lastModified: file.createdAt,
				size: file.sizeBytes,
				input: await getObjectStream(file.storageKey),
			};
		}
	}

	const zip = downloadZip(entries(folder.files), {
		// Sets Content-Length, so the browser can show progress.
		metadata: folder.files.map((f) => ({ name: f.path, size: f.sizeBytes })),
	});
	const headers = new Headers(zip.headers);
	headers.set("Content-Type", "application/zip");
	headers.set(
		"Content-Disposition",
		`attachment; filename*=UTF-8''${encodeURIComponent(`${folder.name}.zip`)}`,
	);
	headers.set("Cache-Control", "no-store");
	return new Response(zip.body, { headers });
}
