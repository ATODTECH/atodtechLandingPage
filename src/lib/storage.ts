import {
	DeleteObjectCommand,
	GetObjectCommand,
	HeadObjectCommand,
	PutObjectCommand,
	S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const BUCKET = process.env.SPACES_BUCKET!;
// All DMS files live under this folder in the shared bucket.
const PREFIX = process.env.SPACES_PREFIX ?? "atod-dms/";

const s3 = new S3Client({
	region: process.env.SPACES_REGION,
	endpoint: process.env.SPACES_ENDPOINT,
	credentials: {
		accessKeyId: process.env.SPACES_KEY!,
		secretAccessKey: process.env.SPACES_SECRET!,
	},
	// Spaces doesn't support the SDK's default CRC32 checksums on presigned PUTs.
	requestChecksumCalculation: "WHEN_REQUIRED",
	responseChecksumValidation: "WHEN_REQUIRED",
});

/** Builds the object key for a document, e.g. `atod-dms/<clientId>/<docId>/report.pdf`. */
export function buildStorageKey(
	clientId: string,
	documentId: string,
	fileName: string,
) {
	const safeName = fileName.replace(/[^\w.\-]+/g, "_");
	return `${PREFIX}${clientId}/${documentId}/${safeName}`;
}

/** Guards against ever touching objects outside the DMS folder. */
function assertInPrefix(key: string) {
	if (!key.startsWith(PREFIX)) {
		throw new Error(`Storage key outside DMS folder: ${key}`);
	}
}

export async function getUploadUrl(
	key: string,
	contentType: string,
	expiresIn = 300,
) {
	assertInPrefix(key);
	return getSignedUrl(
		s3,
		new PutObjectCommand({
			Bucket: BUCKET,
			Key: key,
			ContentType: contentType,
			ACL: "private",
		}),
		{ expiresIn },
	);
}

export async function getDownloadUrl(
	key: string,
	fileName: string,
	disposition: "inline" | "attachment",
	expiresIn = 60,
) {
	assertInPrefix(key);
	return getSignedUrl(
		s3,
		new GetObjectCommand({
			Bucket: BUCKET,
			Key: key,
			// filename* keeps spaces and non-ASCII characters intact (RFC 6266).
			ResponseContentDisposition: `${disposition}; filename*=UTF-8''${encodeURIComponent(fileName)}`,
		}),
		{ expiresIn },
	);
}

export async function deleteObject(key: string) {
	assertInPrefix(key);
	await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}

/** Size and type of an uploaded object, or null if it doesn't exist. */
export async function headObject(key: string) {
	assertInPrefix(key);
	try {
		const head = await s3.send(
			new HeadObjectCommand({ Bucket: BUCKET, Key: key }),
		);
		return { size: head.ContentLength ?? 0, contentType: head.ContentType };
	} catch (error) {
		if ((error as { name?: string }).name === "NotFound") return null;
		throw error;
	}
}
