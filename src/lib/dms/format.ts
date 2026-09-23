// Display helpers shared by server and client components.

import type { AdminRights } from "@/lib/db/schema";

export const RIGHT_LABELS: Record<keyof AdminRights, string> = {
	canUpload: "Upload & rename documents",
	canDelete: "Delete documents",
	canShare: "Share documents & invite clients",
	canManageClients: "Manage clients",
	canManageAdmins: "Manage admins",
	canViewActivity: "View activity log",
};

export function formatBytes(bytes: number) {
	if (bytes < 1024) return `${bytes} B`;
	const units = ["KB", "MB", "GB"];
	let value = bytes / 1024;
	let unit = 0;
	while (value >= 1024 && unit < units.length - 1) {
		value /= 1024;
		unit++;
	}
	return `${value < 10 ? value.toFixed(1) : Math.round(value)} ${units[unit]}`;
}

const dateFormat = new Intl.DateTimeFormat("en-GB", {
	day: "numeric",
	month: "short",
	year: "numeric",
});
const dateTimeFormat = new Intl.DateTimeFormat("en-GB", {
	day: "numeric",
	month: "short",
	year: "numeric",
	hour: "2-digit",
	minute: "2-digit",
});

export function formatDate(date: Date | string) {
	return dateFormat.format(new Date(date));
}

export function formatDateTime(date: Date | string) {
	return dateTimeFormat.format(new Date(date));
}

export type PreviewKind = "pdf" | "image" | "video" | "audio" | "text" | "none";

export function previewKind(mimeType: string): PreviewKind {
	if (mimeType === "application/pdf") return "pdf";
	if (mimeType.startsWith("image/")) return "image";
	if (mimeType.startsWith("video/")) return "video";
	if (mimeType.startsWith("audio/")) return "audio";
	if (
		mimeType.startsWith("text/") ||
		mimeType === "application/json"
	) {
		return "text";
	}
	return "none";
}

export const ACTION_LABELS: Record<string, string> = {
	"document.upload": "Uploaded",
	"document.view": "Viewed",
	"document.download": "Downloaded",
	"document.rename": "Renamed",
	"document.delete": "Deleted",
	"document.visibility_change": "Changed visibility",
	"share.invite": "Shared",
	"share.accept": "Accepted share",
	"share.revoke": "Revoked share",
	"client.create": "Created client",
	"client.update": "Renamed client",
	"client.delete": "Deleted client",
	"admin.add": "Made admin",
	"admin.update_permissions": "Changed admin rights",
	"admin.remove": "Removed admin",
	"user.invite": "Invited user",
	"user.invite_revoke": "Cancelled invite",
	"user.join": "Joined",
};

/** One-line human summary of an activity entry's details. */
export function describeActivity(
	action: string,
	metadata: Record<string, unknown> | null,
	targetEmail?: string | null,
) {
	const m = metadata ?? {};
	const str = (key: string) => (typeof m[key] === "string" ? (m[key] as string) : "");
	switch (action) {
		case "document.rename":
		case "client.update":
			return `${str("from")} → ${str("to")}`;
		case "document.visibility_change":
			return `${str("name")}: ${str("from")} → ${str("to")}`;
		case "share.invite":
			return `${str("name")} with ${str("email")} (${str("access")})`;
		case "share.revoke":
			return `${str("name")} from ${str("email")}`;
		case "user.invite":
			return `${str("email")} as ${str("role")}`;
		case "user.invite_revoke":
		case "user.join":
			return str("email");
		case "admin.add":
		case "admin.update_permissions":
		case "admin.remove":
			return targetEmail ?? str("email");
		default:
			return str("name") || str("documentName") || str("email");
	}
}

const UUID_RE =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** IDs come from URLs; check the shape before they reach Postgres. */
export function isUuid(value: string | undefined | null): value is string {
	return !!value && UUID_RE.test(value);
}
