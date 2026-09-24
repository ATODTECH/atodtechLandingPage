import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download, Globe, Lock } from "lucide-react";

import { DocumentActions } from "@/components/portal/document-actions";
import { SharePanel } from "@/components/portal/share-panel";
import { Badge, FileIcon } from "@/components/portal/ui";
import { listActivity } from "@/lib/dms/activity";
import { getDocument, listShares } from "@/lib/dms/documents";
import { DmsError } from "@/lib/dms/errors";
import {
	ACTION_LABELS,
	describeActivity,
	formatBytes,
	formatDateTime,
	previewKind,
} from "@/lib/dms/format";
import { can, isStaff } from "@/lib/dms/permissions";
import { requireActor } from "@/lib/dms/session";

export default async function DocumentPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const actor = await requireActor();

	const doc = await getDocument(actor, id).catch((error) => {
		if (error instanceof DmsError) notFound();
		throw error;
	});

	const [shares, activity] = await Promise.all([
		can(actor, "canShare") ? listShares(actor, id) : null,
		can(actor, "canViewActivity")
			? listActivity(actor, { documentId: id }).then((r) => r.rows.slice(0, 10))
			: null,
	]);

	const fileUrl = `/portal/documents/${doc.id}/file`;
	const kind = previewKind(doc.mimeType);

	return (
		<>
			<Link
				href="/portal"
				className="mb-4 inline-flex items-center gap-1.5 text-sm text-white/60 hover:text-white"
			>
				<ArrowLeft className="size-4" aria-hidden /> All documents
			</Link>

			<div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
				<div className="flex min-w-0 items-start gap-3">
					<FileIcon mimeType={doc.mimeType} className="mt-1 size-6 shrink-0" />
					<div className="min-w-0">
						<h1 className="text-xl font-semibold break-words sm:text-2xl">{doc.name}</h1>
						<p className="mt-1 text-sm text-white/60">
							{doc.client.name} · {formatBytes(doc.sizeBytes)} · Added{" "}
							{formatDateTime(doc.createdAt)}
							{isStaff(actor) && doc.uploader ? ` by ${doc.uploader.name}` : ""}
						</p>
					</div>
				</div>
				<div className="flex shrink-0 items-center gap-2">
					{doc.visibility === "public" ? (
						<Badge tone="public">
							<Globe className="size-3" aria-hidden /> Public
						</Badge>
					) : isStaff(actor) ? (
						<Badge>
							<Lock className="size-3" aria-hidden /> Private
						</Badge>
					) : null}
					{doc.canDownload ? (
						<a
							href={`${fileUrl}?mode=download`}
							className="inline-flex h-9 items-center gap-2 rounded-lg bg-brand-accent px-4 text-sm font-medium text-white hover:bg-brand-accent/90"
						>
							<Download className="size-4" aria-hidden /> Download
						</a>
					) : null}
				</div>
			</div>

			<div className="grid gap-6 lg:grid-cols-[1fr_320px]">
				<div className="min-h-[60vh] overflow-hidden rounded-lg border border-white/10 bg-black/30">
					{kind === "pdf" || kind === "text" ? (
						<iframe
							src={fileUrl}
							title={`Preview of ${doc.name}`}
							className={`h-[75vh] w-full ${kind === "text" ? "bg-white" : ""}`}
						/>
					) : kind === "image" ? (
						<div className="flex h-full items-center justify-center p-4">
							{/* Signed, short-lived URL: next/image can't optimise it. */}
							{/* eslint-disable-next-line @next/next/no-img-element */}
							<img
								src={fileUrl}
								alt={doc.name}
								className="max-h-[75vh] max-w-full object-contain"
							/>
						</div>
					) : kind === "video" ? (
						<video src={fileUrl} controls className="h-full max-h-[75vh] w-full" />
					) : kind === "audio" ? (
						<div className="flex h-full items-center justify-center p-8">
							<audio src={fileUrl} controls className="w-full max-w-md" />
						</div>
					) : (
						<div className="flex h-full min-h-[60vh] flex-col items-center justify-center gap-3 p-8 text-center">
							<FileIcon mimeType={doc.mimeType} className="size-10" />
							<p className="text-sm text-white/60">
								This file type can&rsquo;t be previewed in the browser.
							</p>
							{doc.canDownload ? (
								<a
									href={`${fileUrl}?mode=download`}
									className="text-sm text-brand-accent hover:underline"
								>
									Download to open it
								</a>
							) : null}
						</div>
					)}
				</div>

				<aside className="flex flex-col gap-4">
					<DocumentActions
						id={doc.id}
						name={doc.name}
						visibility={doc.visibility}
						canRename={can(actor, "canUpload")}
						canChangeVisibility={can(actor, "canShare")}
						canDelete={can(actor, "canDelete")}
					/>

					{shares ? <SharePanel documentId={doc.id} shares={shares} /> : null}

					{activity ? (
						<section className="rounded-lg border border-white/10 p-4">
							<div className="flex items-center justify-between">
								<h2 className="font-medium">Recent activity</h2>
								<Link
									href={`/portal/activity?document=${doc.id}`}
									className="text-xs text-brand-accent hover:underline"
								>
									View all
								</Link>
							</div>
							{activity.length === 0 ? (
								<p className="mt-3 text-sm text-white/50">No activity yet.</p>
							) : (
								<ol className="mt-3 flex flex-col gap-3">
									{activity.map((a) => (
										<li key={a.id} className="text-sm">
											<p>
												<span className="font-medium">{a.actorName ?? "Deleted user"}</span>{" "}
												<span className="text-white/70">
													{(ACTION_LABELS[a.action] ?? a.action).toLowerCase()}
												</span>
												{a.action.startsWith("share.") || a.action === "document.rename" ? (
													<span className="text-white/50">
														{" "}· {describeActivity(a.action, a.metadata, a.targetEmail)}
													</span>
												) : null}
											</p>
											<p className="text-xs text-white/40">{formatDateTime(a.createdAt)}</p>
										</li>
									))}
								</ol>
							)}
						</section>
					) : null}
				</aside>
			</div>
		</>
	);
}
