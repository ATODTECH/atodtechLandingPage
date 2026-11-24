// Upload rules shared by the browser (to check files up front) and the server
// (which enforces them).

export const MAX_UPLOAD_BYTES = 100 * 1024 * 1024;
/** Files per upload, so a stray folder can't queue tens of thousands. */
export const MAX_UPLOAD_FILES = 2000;
/** Files per request to the server; larger uploads are sent in batches. */
export const UPLOAD_BATCH_SIZE = 20;
export const MAX_FOLDER_DEPTH = 20;

const ALLOWED_MIME_TYPES = [
	"application/pdf",
	"image/png",
	"image/jpeg",
	"image/gif",
	"image/webp",
	"image/svg+xml",
	"text/plain",
	"text/csv",
	"text/markdown",
	"application/json",
	"application/zip",
	"application/msword",
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
	"application/vnd.ms-excel",
	"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	"application/vnd.ms-powerpoint",
	"application/vnd.openxmlformats-officedocument.presentationml.presentation",
	"video/mp4",
	"video/webm",
	"audio/mpeg",
];

// Browsers leave the type empty for some extensions, or use a vendor variant
// (Windows reports zips as application/x-zip-compressed).
const EXTENSION_TYPES: Record<string, string> = {
	md: "text/markdown",
	csv: "text/csv",
	json: "application/json",
	zip: "application/zip",
	doc: "application/msword",
	docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
	xls: "application/vnd.ms-excel",
	xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	ppt: "application/vnd.ms-powerpoint",
	pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
};

export function mimeTypeOf(file: { name: string; type: string }) {
	if (ALLOWED_MIME_TYPES.includes(file.type)) return file.type;
	const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
	return EXTENSION_TYPES[ext] ?? (file.type || "application/octet-stream");
}

/** Why a file can't be uploaded, or null if it can. */
export function uploadProblem(file: { mimeType: string; sizeBytes: number }) {
	if (!ALLOWED_MIME_TYPES.includes(file.mimeType)) {
		return "This file type can't be uploaded.";
	}
	if (!(file.sizeBytes > 0)) return "This file is empty.";
	if (file.sizeBytes > MAX_UPLOAD_BYTES) return "Larger than 100 MB.";
	return null;
}

const JUNK_NAMES = new Set(["thumbs.db", "desktop.ini", "__macosx"]);

/** Files the operating system or apps leave in folders, never worth uploading. */
export function isJunkPath(path: string) {
	return path
		.split("/")
		.some(
			(part) =>
				part.startsWith(".") ||
				part.startsWith("~$") ||
				JUNK_NAMES.has(part.toLowerCase()),
		);
}
