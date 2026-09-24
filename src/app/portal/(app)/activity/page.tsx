import Link from "next/link";
import { notFound } from "next/navigation";

import { SelectField } from "@/components/form/select-field";
import { EmptyState, PageHeader } from "@/components/portal/ui";
import { activityAction } from "@/lib/db/schema";
import { listActivity, type ActivityAction } from "@/lib/dms/activity";
import {
	ACTION_LABELS,
	describeActivity,
	formatDateTime,
	isUuid,
} from "@/lib/dms/format";
import { can } from "@/lib/dms/permissions";
import { requireActor } from "@/lib/dms/session";

export default async function ActivityPage({
	searchParams,
}: {
	searchParams: Promise<{ action?: string; document?: string; page?: string }>;
}) {
	const actor = await requireActor();
	if (!can(actor, "canViewActivity")) notFound();

	const params = await searchParams;
	const action = (activityAction.enumValues as readonly string[]).includes(
		params.action ?? "",
	)
		? (params.action as ActivityAction)
		: undefined;
	const documentId = isUuid(params.document) ? params.document : undefined;
	const page = Number.parseInt(params.page ?? "1", 10) || 1;

	const { rows, total, pageCount } = await listActivity(actor, {
		action,
		documentId,
		page,
	});

	const pageHref = (p: number) => {
		const q = new URLSearchParams();
		if (action) q.set("action", action);
		if (documentId) q.set("document", documentId);
		if (p > 1) q.set("page", String(p));
		const qs = q.toString();
		return qs ? `/portal/activity?${qs}` : "/portal/activity";
	};

	return (
		<>
			<PageHeader
				title="Activity"
				description={`Everything that happens in the portal, newest first. ${total} ${total === 1 ? "entry" : "entries"}.`}
			/>

			<form className="mb-4 flex flex-wrap items-center gap-2">
				{documentId ? <input type="hidden" name="document" value={documentId} /> : null}
				<SelectField
					id="action"
					label="Filter by action"
					labelClassName="sr-only"
					className="w-full sm:w-64"
					defaultValue={action ?? "all"}
					options={[
						{ value: "all", label: "All actions" },
						...activityAction.enumValues.map((a) => ({
							value: a,
							label: ACTION_LABELS[a] ?? a,
						})),
					]}
				/>
				<button
					type="submit"
					className="h-11.5 cursor-pointer rounded-lg border border-white/15 bg-white/5 px-4 text-sm hover:bg-white/10"
				>
					Filter
				</button>
				{action || documentId ? (
					<Link href="/portal/activity" className="text-sm text-brand-accent hover:underline">
						Clear filters
					</Link>
				) : null}
			</form>

			{rows.length === 0 ? (
				<EmptyState title="No activity found" />
			) : (
				<div className="overflow-x-auto rounded-lg border border-white/10">
					<table className="w-full text-left text-sm">
						<thead className="border-b border-white/10 bg-white/[0.03] text-xs text-white/50 uppercase">
							<tr>
								<th className="px-4 py-3 font-medium whitespace-nowrap">When</th>
								<th className="px-4 py-3 font-medium">Who</th>
								<th className="px-4 py-3 font-medium">Action</th>
								<th className="px-4 py-3 font-medium">Details</th>
								<th className="hidden px-4 py-3 font-medium lg:table-cell">IP</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-white/5">
							{rows.map((row) => (
								<tr key={row.id}>
									<td className="px-4 py-3 whitespace-nowrap text-white/60">
										{formatDateTime(row.createdAt)}
									</td>
									<td className="px-4 py-3">
										<p>{row.actorName ?? "Deleted user"}</p>
										{row.actorEmail ? (
											<p className="text-xs text-white/40">{row.actorEmail}</p>
										) : null}
									</td>
									<td className="px-4 py-3 whitespace-nowrap">
										{ACTION_LABELS[row.action] ?? row.action}
									</td>
									<td className="max-w-xs px-4 py-3 text-white/70">
										{row.documentId && !row.action.startsWith("client.") ? (
											<Link
												href={`/portal/activity?document=${row.documentId}`}
												className="hover:underline"
												title="Show all activity for this document"
											>
												{describeActivity(row.action, row.metadata, row.targetEmail)}
											</Link>
										) : (
											describeActivity(row.action, row.metadata, row.targetEmail)
										)}
									</td>
									<td className="hidden px-4 py-3 text-xs text-white/40 lg:table-cell">
										{row.ipAddress ?? "—"}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}

			{pageCount > 1 ? (
				<nav className="mt-4 flex items-center justify-between text-sm" aria-label="Pagination">
					{page > 1 ? (
						<Link href={pageHref(page - 1)} className="text-brand-accent hover:underline">
							← Newer
						</Link>
					) : (
						<span />
					)}
					<span className="text-white/50">
						Page {page} of {pageCount}
					</span>
					{page < pageCount ? (
						<Link href={pageHref(page + 1)} className="text-brand-accent hover:underline">
							Older →
						</Link>
					) : (
						<span />
					)}
				</nav>
			) : null}
		</>
	);
}
