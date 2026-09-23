import Link from "next/link";
import { Download, Globe, Lock } from "lucide-react";

import { DocumentFilters } from "@/components/portal/document-filters";
import {
	Badge,
	EmptyState,
	FileIcon,
	PageHeader,
} from "@/components/portal/ui";
import { UploadDialog } from "@/components/portal/upload-dialog";
import { listClients } from "@/lib/dms/clients";
import { listDocuments } from "@/lib/dms/documents";
import { formatBytes, formatDate } from "@/lib/dms/format";
import { can, isStaff } from "@/lib/dms/permissions";
import { requireActor } from "@/lib/dms/session";

export default async function DocumentsPage({
	searchParams,
}: {
	searchParams: Promise<{ client?: string; q?: string }>;
}) {
	const actor = await requireActor();
	const { client: clientId, q } = await searchParams;
	const staff = isStaff(actor);

	const [documents, clients] = await Promise.all([
		listDocuments(actor, { clientId, query: q?.trim() || undefined }),
		listClients(actor),
	]);
	const filtered = Boolean(clientId || q);

	return (
		<>
			<PageHeader
				title="Documents"
				description={
					staff
						? "Every document across all clients."
						: "Documents shared with you and public documents."
				}
			>
				{can(actor, "canUpload") ? (
					<UploadDialog clients={clients} defaultClientId={clientId} />
				) : null}
			</PageHeader>

			<DocumentFilters clients={clients} />

			{documents.length === 0 ? (
				<EmptyState title={filtered ? "No matching documents" : "No documents yet"}>
					{filtered
						? "Try a different search or client."
						: staff
							? "Upload a document to get started."
							: "Documents shared with you will appear here."}
				</EmptyState>
			) : (
				<div className="overflow-hidden rounded-xl border border-white/10">
					<table className="w-full text-left text-sm">
						<thead className="border-b border-white/10 bg-white/[0.03] text-xs text-white/50 uppercase">
							<tr>
								<th className="w-full px-4 py-3 font-medium">Name</th>
								<th className="hidden px-4 py-3 font-medium whitespace-nowrap md:table-cell">Client</th>
								<th className="hidden px-4 py-3 font-medium whitespace-nowrap sm:table-cell">Size</th>
								<th className="hidden px-4 py-3 font-medium whitespace-nowrap lg:table-cell">Added</th>
								<th className="px-4 py-3 font-medium">
									<span className="sr-only">Actions</span>
								</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-white/5">
							{documents.map((doc) => (
								<tr key={doc.id} className="transition-colors hover:bg-white/[0.03]">
									<td className="max-w-0 px-4 py-3">
										<Link
											href={`/portal/documents/${doc.id}`}
											className="flex items-center gap-3"
										>
											<FileIcon mimeType={doc.mimeType} className="shrink-0" />
											<span className="truncate font-medium hover:underline">
												{doc.name}
											</span>
											{doc.visibility === "public" ? (
												<Badge tone="public" className="shrink-0">
													<Globe className="size-3" aria-hidden />
													Public
												</Badge>
											) : staff ? (
												<Lock
													className="size-3.5 shrink-0 text-white/30"
													aria-label="Private"
												/>
											) : null}
										</Link>
									</td>
									<td className="hidden px-4 py-3 whitespace-nowrap text-white/70 md:table-cell">
										{doc.clientName}
									</td>
									<td className="hidden px-4 py-3 whitespace-nowrap text-white/70 sm:table-cell">
										{formatBytes(doc.sizeBytes)}
									</td>
									<td className="hidden px-4 py-3 whitespace-nowrap text-white/70 lg:table-cell">
										{formatDate(doc.createdAt)}
									</td>
									<td className="px-4 py-3 text-right">
										{doc.canDownload ? (
											<a
												href={`/portal/documents/${doc.id}/file?mode=download`}
												className="inline-flex size-8 items-center justify-center rounded-lg text-white/60 hover:bg-white/10 hover:text-white"
												aria-label={`Download ${doc.name}`}
											>
												<Download className="size-4" aria-hidden />
											</a>
										) : null}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</>
	);
}
