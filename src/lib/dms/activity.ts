import "server-only";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { activityLog } from "@/lib/db/schema";

type ActivityEntry = Omit<
	typeof activityLog.$inferInsert,
	"id" | "createdAt" | "ipAddress" | "userAgent"
>;

/** Records an audit entry, capturing the request's IP and user agent. */
export async function logActivity(entry: ActivityEntry) {
	const h = await headers();
	const ipAddress =
		h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip");

	await db.insert(activityLog).values({
		...entry,
		ipAddress,
		userAgent: h.get("user-agent"),
	});
}
