import "server-only";
import { and, count, desc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { activityAction, activityLog, user } from "@/lib/db/schema";
import { isUuid } from "@/lib/dms/format";
import { assertCan, type Actor } from "@/lib/dms/permissions";

export type ActivityAction = (typeof activityAction.enumValues)[number];

export const ACTIVITY_PAGE_SIZE = 50;

/** Newest-first activity, optionally filtered. Needs the "view activity" right. */
export async function listActivity(
	actor: Actor,
	filters: {
		documentId?: string;
		actorId?: string;
		action?: ActivityAction;
		page?: number;
	} = {},
) {
	assertCan(actor, "canViewActivity");
	const page = Math.max(1, filters.page ?? 1);
	const target = alias(user, "target");

	const where = and(
		isUuid(filters.documentId)
			? eq(activityLog.documentId, filters.documentId)
			: undefined,
		filters.actorId ? eq(activityLog.actorId, filters.actorId) : undefined,
		filters.action ? eq(activityLog.action, filters.action) : undefined,
	);

	const [rows, [{ total }]] = await Promise.all([
		db
			.select({
				id: activityLog.id,
				action: activityLog.action,
				createdAt: activityLog.createdAt,
				metadata: activityLog.metadata,
				ipAddress: activityLog.ipAddress,
				documentId: activityLog.documentId,
				actorName: user.name,
				actorEmail: user.email,
				targetEmail: target.email,
			})
			.from(activityLog)
			.leftJoin(user, eq(user.id, activityLog.actorId))
			.leftJoin(target, eq(target.id, activityLog.targetUserId))
			.where(where)
			.orderBy(desc(activityLog.createdAt))
			.limit(ACTIVITY_PAGE_SIZE)
			.offset((page - 1) * ACTIVITY_PAGE_SIZE),
		db.select({ total: count() }).from(activityLog).where(where),
	]);

	return { rows, total, page, pageCount: Math.ceil(total / ACTIVITY_PAGE_SIZE) };
}

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
