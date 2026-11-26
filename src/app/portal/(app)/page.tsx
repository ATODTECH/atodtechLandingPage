import Link from "next/link";
import { redirect } from "next/navigation";
import { Building2, ChevronRight, Download, Folder, Globe, Lock } from "lucide-react";

import { DocumentFilters } from "@/components/portal/document-filters";
import { FolderActions } from "@/components/portal/folder-actions";
import {
	Badge,
	EmptyState,
	FileIcon,
	PageHeader,
} from "@/components/portal/ui";
import { UploadDialog } from "@/components/portal/upload-dialog";
import { listClients } from "@/lib/dms/clients";
import { listDocuments } from "@/lib/dms/documents";
import { folderPath, listFolderShares, listFolders } from "@/lib/dms/folders";
import { formatBytes, formatDate } from "@/lib/dms/format";
import { can, canUploadTo, isStaff } from "@/lib/dms/permissions";
import { requireActor } from "@/lib/dms/session";

export default async function DocumentsPage({
	searchParams,
}: {
	searchParams: Promise<{ client?: string; q?: string; folder?: string }>;
}) {
	const actor = await requireActor();
	const { client: clientParam, q, folder: folderId } = await searchParams;
	const query = q?.trim() || undefined;
	const staff = isStaff(actor);

	const [allFolders, clients] = await Promise.all([
		listFolders(actor),
		listClients(actor),
	]);
	const path = folderPath(allFolders, folderId ?? null);
	const openFolder = path.at(-1);
	// Gone, emptied, or never visible to this person.
	if (folderId && !openFolder) redirect("/portal");

	const clientId = openFolder?.clientId ?? clientParam;
	// A search covers every folder; otherwise show one level at a time.
	const [documents, folderShares] = await Promise.all([
		listDocuments(actor, {
			clientId,
			query,
			folderId: query ? undefined : openFolder?.id ?? null,
		}),
		openFolder && can(actor, "canShare")
			? listFolderShares(actor, openFolder.id)
			: null,
	]);
	const folders = query
		? []
		: [...allFolders.values()].filter(
				(f) =>
					f.parentId === (openFolder?.id ?? null) &&
					(!clientId || f.clientId === clientId),
			);
	const filtered = Boolean(clientId || query);
	const canUpload = openFolder
		? canUploadTo(actor, openFolder.clientId)
		: can(actor, "canUpload") || actor.clientIds.length > 0;

	return (
		<>
			<PageHeader
				title="Documents"
				description={
					staff
						? "Every document across all clients."
						: actor.clientIds.length > 0
							? "Your company's shared folder, plus documents shared with you."
							: "Documents shared with you and public documents."
				}
			>
				{openFolder ? (
					<FolderActions
						folderId={openFolder.id}
						name={openFolder.name}
						canDownload={openFolder.downloadableCount > 0}
						shares={folderShares}
					/>
				) : null}
				{canUpload ? (
					<UploadDialog
						// Start fresh when moving to another folder or client.
						key={openFolder?.id ?? clientId}
						clients={
							openFolder
								? clients.filter((c) => c.id === openFolder.clientId)
								: clients
						}
						defaultClientId={clientId}
						folder={
							openFolder
								? {
										id: openFolder.id,
										path: path.map((f) => f.name).join(" / "),
									}
								: undefined
						}
						asClient={!staff}
					/>
				) : null}
			</PageHeader>

			{actor.role === "client" && actor.clientIds.length === 0 ? (
				<p
					role="status"
					className="mb-4 rounded-lg border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-200"
				>
					Uploading isn&rsquo;t set up for your account yet. Ask the Atod Tech
					team to add you to your company&rsquo;s folder.
				</p>
			) : null}

			<DocumentFilters clients={clients} />

			{openFolder ? (
				<nav aria-label="Folders" className="mb-4">
					<ol className="flex flex-wrap items-center gap-1.5 text-sm text-white/60">
						<li>
							<Link href="/portal" className="hover:text-white">
								All documents
							</Link>
						</li>
						{clients.length > 1 ? (
							<Crumb href={`/portal?client=${openFolder.clientId}`}>
								{openFolder.clientName}
							</Crumb>
						) : null}
						{path.map((f) => (
							<Crumb
								key={f.id}
								href={`/portal?folder=${f.id}`}
								current={f.id === openFolder.id}
							>
								{f.name}
							</Crumb>
						))}
					</ol>
				</nav>
			) : null}

			{documents.length === 0 && folders.length === 0 ? (
				<EmptyState title={filtered ? "No matching documents" : "No documents yet"}>
					{filtered
						? "Try a different search or client."
						: staff || actor.clientIds.length > 0
							? "Upload a document to get started."
							: "Documents shared with you will appear here."}
				</EmptyState>
			) : (
				<div className="overflow-hidden rounded-lg border border-white/10">
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
							{folders.map((f) => (
								<tr key={f.id} className="transition-colors hover:bg-white/[0.03]">
									<td className="max-w-0 px-4 py-3">
										<Link
											href={`/portal?folder=${f.id}`}
											className="flex items-center gap-3"
										>
											<Folder
												className="size-5 shrink-0 fill-brand-accent/20 text-brand-accent"
												aria-label="Folder"
											/>
											<span className="truncate font-medium hover:underline">
												{f.name}
											</span>
										</Link>
									</td>
									<td className="hidden px-4 py-3 whitespace-nowrap text-white/70 md:table-cell">
										{f.clientName}
									</td>
									<td className="hidden px-4 py-3 whitespace-nowrap text-white/70 sm:table-cell">
										{f.documentCount === 1 ? "1 file" : `${f.documentCount} files`}
									</td>
									<td className="hidden px-4 py-3 whitespace-nowrap text-white/70 lg:table-cell">
										{formatDate(f.createdAt)}
									</td>
									<td className="px-4 py-3 text-right">
										{f.downloadableCount > 0 ? (
											<a
												href={`/portal/folders/${f.id}/download`}
												className="inline-flex size-8 items-center justify-center rounded-lg text-white/60 hover:bg-white/10 hover:text-white"
												aria-label={`Download ${f.name} as a zip`}
												title="Download as zip"
											>
												<Download className="size-4" aria-hidden />
											</a>
										) : null}
									</td>
								</tr>
							))}
							{documents.map((doc) => (
								<tr key={doc.id} className="transition-colors hover:bg-white/[0.03]">
									<td className="max-w-0 px-4 py-3">
										<Link
											href={`/portal/documents/${doc.id}`}
											className="flex items-center gap-3"
										>
											<FileIcon mimeType={doc.mimeType} className="shrink-0" />
											<span className="min-w-0">
												<span className="block truncate font-medium hover:underline">
													{doc.name}
												</span>
												{query && doc.folderId ? (
													<span className="block truncate text-xs text-white/50">
														{folderPath(allFolders, doc.folderId)
															.map((f) => f.name)
															.join(" / ")}
													</span>
												) : null}
											</span>
											{doc.uploadedByClient ? (
												<Badge tone="accent" className="shrink-0">
													<Building2 className="size-3" aria-hidden />
													{staff ? "Client upload" : doc.uploaderName ?? "Client"}
												</Badge>
											) : null}
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

function Crumb({
	href,
	current = false,
	children,
}: {
	href: string;
	current?: boolean;
	children: React.ReactNode;
}) {
	return (
		<li className="flex min-w-0 items-center gap-1.5">
			<ChevronRight className="size-3.5 shrink-0 text-white/30" aria-hidden />
			{current ? (
				<span aria-current="page" className="truncate text-white">
					{children}
				</span>
			) : (
				<Link href={href} className="truncate hover:text-white">
					{children}
				</Link>
			)}
		</li>
	);
}
