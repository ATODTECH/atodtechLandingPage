"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
	CheckCircle2,
	FilePlus,
	FolderPlus,
	Upload,
	X,
	XCircle,
} from "lucide-react";
import { toast } from "sonner";

import {
	confirmUploadsAction,
	finishUploadsAction,
	requestUploadsAction,
} from "@/app/portal/actions";
import { LoadingButton } from "@/components/form/loading-button";
import { SelectField } from "@/components/form/select-field";
import { dialogClassName } from "@/components/portal/ui";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
	fromDrop,
	fromFileList,
	TooManyFilesError,
	type PickedFile,
} from "@/lib/dms/collect-files";
import { formatBytes } from "@/lib/dms/format";
import {
	isJunkPath,
	MAX_FOLDER_DEPTH,
	MAX_UPLOAD_FILES,
	mimeTypeOf,
	UPLOAD_BATCH_SIZE,
	uploadProblem,
} from "@/lib/dms/uploads";
import { cn } from "@/lib/utils";

const PARALLEL_UPLOADS = 4;
// Upload links expire, so a batch must be small enough to finish in time.
const MAX_BATCH_BYTES = 200 * 1024 * 1024;
// Enough to check the selection without rendering thousands of rows.
const MAX_LISTED = 100;

const TOO_MANY_FILES = `That's more than ${MAX_UPLOAD_FILES.toLocaleString("en-GB")} files. Upload it in smaller parts.`;
const CANCELLED = "Cancelled";

/** PUTs the file straight to Spaces, reporting progress (fetch can't). */
function putFile(
	url: string,
	item: UploadItem,
	signal: AbortSignal,
	onProgress: (fraction: number) => void,
) {
	return new Promise<void>((resolve, reject) => {
		if (signal.aborted) return reject(new Error(CANCELLED));
		const xhr = new XMLHttpRequest();
		const abort = () => xhr.abort();
		signal.addEventListener("abort", abort);
		xhr.onloadend = () => signal.removeEventListener("abort", abort);
		xhr.open("PUT", url);
		xhr.setRequestHeader("Content-Type", item.mimeType);
		xhr.setRequestHeader("x-amz-acl", "private");
		xhr.upload.onprogress = (e) => {
			if (e.lengthComputable) onProgress(e.loaded / e.total);
		};
		xhr.onload = () =>
			xhr.status >= 200 && xhr.status < 300
				? resolve()
				: reject(new Error(`Upload failed (${xhr.status})`));
		xhr.onerror = () =>
			reject(new Error("Couldn't reach file storage. Check your connection and try again."));
		xhr.onabort = () => reject(new Error(CANCELLED));
		xhr.send(item.file);
	});
}

type UploadItem = {
	/** Path and size: picking the same file twice only adds it once. */
	key: string;
	file: File;
	folderPath: string;
	path: string;
	mimeType: string;
	/** Why this file can't be uploaded at all. */
	problem: string | null;
	progress: number;
	status: "queued" | "uploading" | "done" | "error";
	error?: string;
	/** Set once the server has a record, so a retry reuses it. */
	documentId?: string;
};

function toItem({ file, folderPath }: PickedFile): UploadItem {
	const path = folderPath ? `${folderPath}/${file.name}` : file.name;
	const mimeType = mimeTypeOf(file);
	return {
		key: `${path}:${file.size}:${file.lastModified}`,
		file,
		folderPath,
		path,
		mimeType,
		problem:
			uploadProblem({ mimeType, sizeBytes: file.size }) ??
			(folderPath.split("/").length > MAX_FOLDER_DEPTH
				? `More than ${MAX_FOLDER_DEPTH} folders deep.`
				: null),
		progress: 0,
		status: "queued",
	};
}

function toBatches(items: UploadItem[]) {
	const batches: UploadItem[][] = [];
	let batch: UploadItem[] = [];
	let bytes = 0;
	for (const item of items) {
		if (
			batch.length > 0 &&
			(batch.length === UPLOAD_BATCH_SIZE ||
				bytes + item.file.size > MAX_BATCH_BYTES)
		) {
			batches.push(batch);
			batch = [];
			bytes = 0;
		}
		batch.push(item);
		bytes += item.file.size;
	}
	if (batch.length > 0) batches.push(batch);
	return batches;
}

const plural = (count: number, noun: string) =>
	`${count} ${noun}${count === 1 ? "" : "s"}`;

export function UploadDialog({
	clients,
	defaultClientId,
	folder,
	asClient = false,
}: {
	clients: { id: string; name: string }[];
	defaultClientId?: string;
	/** The open folder, which uploads go into. */
	folder?: { id: string; path: string };
	/** Client users upload into their company's shared folder. */
	asClient?: boolean;
}) {
	const router = useRouter();
	const [open, setOpen] = useState(false);
	// With only one client to choose from, there's nothing to pick.
	const [clientId, setClientId] = useState(
		clients.length === 1 ? clients[0].id : defaultClientId ?? "",
	);
	const [items, setItems] = useState<UploadItem[]>([]);
	const [skipped, setSkipped] = useState(0);
	const [reading, setReading] = useState(false);
	const [dragging, setDragging] = useState(false);
	const [uploading, setUploading] = useState(false);
	const abortRef = useRef<AbortController | null>(null);
	const fileInput = useRef<HTMLInputElement>(null);
	const folderInput = useRef<HTMLInputElement>(null);

	// Leaving mid-upload loses the rest: warn first, and if they go anyway,
	// make sure owners hear about the files that made it.
	useEffect(() => {
		if (!uploading) return;
		const warn = (event: BeforeUnloadEvent) => event.preventDefault();
		const finish = () => navigator.sendBeacon("/portal/uploads/finish");
		window.addEventListener("beforeunload", warn);
		window.addEventListener("pagehide", finish);
		return () => {
			window.removeEventListener("beforeunload", warn);
			window.removeEventListener("pagehide", finish);
		};
	}, [uploading]);

	const update = (keys: string[], patch: Partial<UploadItem>) =>
		setItems((prev) =>
			prev.map((item) => (keys.includes(item.key) ? { ...item, ...patch } : item)),
		);

	function add(picked: PickedFile[]) {
		const wanted = picked.map(toItem).filter((item) => !isJunkPath(item.path));
		const known = new Set(items.map((item) => item.key));
		const fresh = wanted
			.filter((item) => !known.has(item.key))
			.sort((a, b) =>
				a.path.localeCompare(b.path, undefined, { numeric: true }),
			);
		if (items.length + fresh.length > MAX_UPLOAD_FILES) {
			toast.error(TOO_MANY_FILES);
			return;
		}
		setSkipped((count) => count + picked.length - wanted.length);
		setItems([...items, ...fresh]);
		if (picked.length === 0) toast.error("That folder is empty.");
	}

	async function handleDrop(event: React.DragEvent) {
		event.preventDefault();
		setDragging(false);
		if (uploading || reading || allDone) return;
		setReading(true);
		try {
			add(await fromDrop(event.dataTransfer, MAX_UPLOAD_FILES));
		} catch (error) {
			toast.error(
				error instanceof TooManyFilesError
					? TOO_MANY_FILES
					: "Couldn't read what you dropped. Try choosing it instead.",
			);
		} finally {
			setReading(false);
		}
	}

	function handlePick(event: React.ChangeEvent<HTMLInputElement>) {
		const picked = fromFileList(event.target.files);
		// So picking the same thing again still fires a change.
		event.target.value = "";
		if (picked.length > 0) add(picked);
	}

	function clear() {
		setItems([]);
		setSkipped(0);
	}

	/** Uploads one batch, returning how many files made it. */
	async function uploadBatch(batch: UploadItem[], signal: AbortSignal) {
		const requested = await requestUploadsAction({
			clientId,
			folderId: folder?.id ?? null,
			files: batch.map((item) => ({
				fileName: item.file.name,
				mimeType: item.mimeType,
				sizeBytes: item.file.size,
				folderPath: item.folderPath,
				documentId: item.documentId,
			})),
		});
		if (!requested.ok) throw new Error(requested.error);

		const sent: { key: string; documentId: string }[] = [];
		const queue = batch.map((item, i) => ({ item, ticket: requested.data[i] }));
		const worker = async () => {
			for (let next = queue.shift(); next; next = queue.shift()) {
				const { item, ticket } = next;
				if (!ticket.ok) {
					update([item.key], { status: "error", error: ticket.error });
					continue;
				}
				const { documentId, uploadUrl } = ticket;
				update([item.key], {
					documentId,
					status: signal.aborted ? "queued" : "uploading",
					progress: 0,
					error: undefined,
				});
				try {
					if (uploadUrl) {
						await putFile(uploadUrl, item, signal, (progress) =>
							update([item.key], { progress }),
						);
					}
					sent.push({ key: item.key, documentId });
				} catch (error) {
					update(
						[item.key],
						signal.aborted
							? { status: "queued", progress: 0 }
							: {
									status: "error",
									progress: 0,
									error: error instanceof Error ? error.message : "Upload failed.",
								},
					);
				}
			}
		};
		await Promise.all(Array.from({ length: PARALLEL_UPLOADS }, worker));
		if (sent.length === 0) return 0;

		const confirmed = await confirmUploadsAction(sent.map((s) => s.documentId));
		if (!confirmed.ok) throw new Error(confirmed.error);
		const failures = confirmed.data;
		for (const [i, { key }] of sent.entries()) {
			const error = failures[i];
			update(
				[key],
				error
					? { status: "error", progress: 0, error }
					: { status: "done", progress: 1 },
			);
		}
		return failures.filter((error) => error === null).length;
	}

	async function uploadAll() {
		const controller = new AbortController();
		abortRef.current = controller;
		setUploading(true);
		let succeeded = 0;

		const pending = items.filter((item) => !item.problem && item.status !== "done");
		for (const batch of toBatches(pending)) {
			if (controller.signal.aborted) break;
			try {
				succeeded += await uploadBatch(batch, controller.signal);
			} catch (error) {
				const message = error instanceof Error ? error.message : "Upload failed.";
				const keys = new Set(batch.map((item) => item.key));
				setItems((prev) =>
					prev.map((item) =>
						keys.has(item.key) && item.status !== "done" && item.status !== "error"
							? { ...item, status: "error", progress: 0, error: message }
							: item,
					),
				);
			}
		}

		// Also emails owners one summary, and refreshes the list. The files are
		// in either way, so a failure here isn't the uploader's problem.
		if (succeeded > 0) await finishUploadsAction().catch(() => {});
		setUploading(false);
		abortRef.current = null;
		router.refresh();
		if (succeeded > 0) toast.success(`${plural(succeeded, "document")} uploaded.`);
	}

	const blocked = items.filter((item) => item.problem);
	const uploadable = items.filter((item) => !item.problem);
	const done = uploadable.filter((item) => item.status === "done").length;
	const failed = uploadable.filter((item) => item.status === "error").length;
	const allDone = uploadable.length > 0 && done === uploadable.length;
	const started = uploading || done > 0 || failed > 0;

	const totalBytes = uploadable.reduce((sum, item) => sum + item.file.size, 0);
	const sentBytes = uploadable.reduce(
		(sum, item) => sum + item.file.size * item.progress,
		0,
	);
	const percent = totalBytes > 0 ? Math.round((sentBytes / totalBytes) * 100) : 0;

	// Failures first once finished, so they aren't lost in a long list.
	const ordered = uploading
		? uploadable
		: [...uploadable].sort(
				(a, b) => Number(b.status === "error") - Number(a.status === "error"),
			);
	const clientName = clients.find((c) => c.id === clientId)?.name;

	return (
		<Dialog
			open={open}
			onOpenChange={(next) => {
				if (uploading) return;
				setOpen(next);
				if (!next) clear();
			}}
		>
			<DialogTrigger
				render={
					<Button className="h-9 cursor-pointer rounded-lg bg-brand-accent px-4 text-white hover:bg-brand-accent/90" />
				}
			>
				<Upload aria-hidden />
				Upload
			</DialogTrigger>
			<DialogContent
				className={cn(
					dialogClassName,
					"max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg",
				)}
				// On the whole dialog: the browser opens files dropped anywhere else.
				onDragOver={(e) => {
					e.preventDefault();
					setDragging(true);
				}}
				onDragLeave={(e) => {
					if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
						setDragging(false);
					}
				}}
				onDrop={handleDrop}
			>
				<DialogHeader>
					<DialogTitle>Upload documents</DialogTitle>
					<DialogDescription>
						{asClient
							? "Files you upload are visible to the Atod Tech team and everyone at your company. Max 100 MB each."
							: "New documents are private until you share them or make them public. Max 100 MB each."}
					</DialogDescription>
				</DialogHeader>

				{clients.length === 0 ? (
					<p className="text-sm text-white/70">
						Add a client first.{" "}
						<Link href="/portal/clients" className="text-brand-accent underline">
							Go to clients
						</Link>
					</p>
				) : (
					<div className="flex min-w-0 flex-col gap-4">
						{clients.length === 1 ? (
							<p className="text-sm break-words text-white/70">
								Uploading to{" "}
								<strong className="text-white">
									{folder ? `${clientName} / ${folder.path}` : clientName}
								</strong>
							</p>
						) : (
							<SelectField
								id="upload-client"
								label="Client"
								placeholder="Choose a client…"
								options={clients.map((c) => ({ value: c.id, label: c.name }))}
								value={clientId}
								onValueChange={setClientId}
								// Retries must go to the client the upload started with.
								disabled={started}
							/>
						)}

						{!uploading && !allDone ? (
							<div className="flex flex-col gap-2">
								<Label htmlFor="upload-files" className="text-sm text-[#EAEAEA]">
									Files
								</Label>
								<div
									className={cn(
										"flex flex-col items-center gap-3 rounded-lg border border-dashed border-white/20 px-4 py-6 text-center transition-colors",
										dragging && "border-brand-accent bg-brand-accent/10",
									)}
								>
									<p className="text-sm text-white/60">
										{reading
											? "Reading files…"
											: "Drag files or folders here, or"}
									</p>
									<div className="flex flex-wrap justify-center gap-2">
										<Button
											variant="outline"
											disabled={reading}
											onClick={() => fileInput.current?.click()}
											className="h-9 cursor-pointer rounded-lg border-white/15 bg-white/5 px-3 text-white hover:bg-white/10"
										>
											<FilePlus aria-hidden /> Choose files
										</Button>
										<Button
											variant="outline"
											disabled={reading}
											onClick={() => folderInput.current?.click()}
											className="h-9 cursor-pointer rounded-lg border-white/15 bg-white/5 px-3 text-white hover:bg-white/10"
										>
											<FolderPlus aria-hidden /> Choose folder
										</Button>
									</div>
									<input
										ref={fileInput}
										id="upload-files"
										type="file"
										multiple
										hidden
										onChange={handlePick}
									/>
									<input
										ref={folderInput}
										id="upload-folder"
										type="file"
										aria-label="Folder"
										multiple
										hidden
										onChange={handlePick}
										// Not in React's types.
										{...{ webkitdirectory: "" }}
									/>
								</div>
							</div>
						) : null}

						{started && uploadable.length > 0 ? (
							<div className="flex flex-col gap-2">
								<div className="flex justify-between text-sm text-white/70">
									<span aria-live="polite">
										{done} of {plural(uploadable.length, "file")} uploaded
										{failed > 0 ? `, ${failed} failed` : ""}
									</span>
									<span>{percent}%</span>
								</div>
								<div
									role="progressbar"
									aria-label="Upload progress"
									aria-valuenow={percent}
									aria-valuemin={0}
									aria-valuemax={100}
									className="h-1.5 overflow-hidden rounded-lg bg-white/10"
								>
									<div
										className="h-full bg-brand-accent transition-[width]"
										style={{ width: `${percent}%` }}
									/>
								</div>
							</div>
						) : uploadable.length > 0 ? (
							<div className="flex items-center justify-between text-sm text-white/70">
								<span>
									{plural(uploadable.length, "file")}, {formatBytes(totalBytes)}
								</span>
								<button
									type="button"
									onClick={clear}
									className="cursor-pointer text-brand-accent hover:underline"
								>
									Clear
								</button>
							</div>
						) : null}

						{uploadable.length > 0 ? (
							<ul
								aria-label="Files to upload"
								className="flex max-h-56 flex-col gap-2 overflow-y-auto"
							>
								{ordered.slice(0, MAX_LISTED).map((item) => (
									<li
										key={item.key}
										className="rounded-lg border border-white/10 px-3 py-2"
									>
										<div className="flex items-center gap-2 text-sm">
											<span className="min-w-0 flex-1 truncate" title={item.path}>
												{item.folderPath ? (
													<span className="text-white/50">{item.folderPath}/</span>
												) : null}
												{item.file.name}
											</span>
											<span className="shrink-0 text-xs text-white/50">
												{formatBytes(item.file.size)}
											</span>
											{item.status === "done" ? (
												<CheckCircle2
													className="size-4 shrink-0 text-emerald-400"
													aria-label="Uploaded"
												/>
											) : item.status === "error" ? (
												<XCircle
													className="size-4 shrink-0 text-destructive"
													aria-label="Failed"
												/>
											) : null}
											{!uploading && item.status !== "done" ? (
												<button
													type="button"
													aria-label={`Remove ${item.path}`}
													onClick={() =>
														setItems((prev) =>
															prev.filter((other) => other.key !== item.key),
														)
													}
													className="shrink-0 cursor-pointer text-white/50 hover:text-white"
												>
													<X className="size-4" aria-hidden />
												</button>
											) : null}
										</div>
										{item.status === "uploading" ? (
											<div className="mt-2 h-1 overflow-hidden rounded-lg bg-white/10">
												<div
													className="h-full bg-brand-accent transition-[width]"
													style={{ width: `${Math.round(item.progress * 100)}%` }}
												/>
											</div>
										) : null}
										{item.error ? (
											<p className="mt-1 text-xs text-destructive">{item.error}</p>
										) : null}
									</li>
								))}
								{ordered.length > MAX_LISTED ? (
									<li className="px-3 py-1 text-xs text-white/50">
										and {plural(ordered.length - MAX_LISTED, "more file")}
									</li>
								) : null}
							</ul>
						) : null}

						{blocked.length > 0 ? (
							<details
								// Nothing to upload: show why straight away.
								open={uploadable.length === 0 ? true : undefined}
								className="rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-sm text-amber-200"
							>
								<summary className="cursor-pointer">
									{`${plural(blocked.length, "file")} can’t be uploaded`}
									{uploadable.length > 0 ? " and will be left out" : ""}
								</summary>
								<ul className="mt-2 flex max-h-32 flex-col gap-1 overflow-y-auto text-xs">
									{blocked.slice(0, MAX_LISTED).map((item) => (
										<li key={item.key} className="break-words">
											{item.path}: {item.problem}
										</li>
									))}
									{blocked.length > MAX_LISTED ? (
										<li>and {plural(blocked.length - MAX_LISTED, "more file")}</li>
									) : null}
								</ul>
							</details>
						) : null}
						{skipped > 0 ? (
							<p className="text-xs text-white/50">
								{plural(skipped, "hidden or system file")} skipped.
							</p>
						) : null}
					</div>
				)}

				<DialogFooter className="rounded-b-lg border-white/10 bg-white/5">
					{uploading ? (
						<Button
							variant="outline"
							className="cursor-pointer rounded-lg"
							onClick={() => abortRef.current?.abort()}
						>
							Cancel
						</Button>
					) : null}
					{allDone && !uploading ? (
						<Button
							className="cursor-pointer rounded-lg"
							onClick={() => {
								setOpen(false);
								clear();
							}}
						>
							Done
						</Button>
					) : (
						<LoadingButton
							loading={uploading}
							loadingText="Uploading…"
							disabled={!clientId || uploadable.length === 0 || reading}
							onClick={uploadAll}
							className="rounded-lg bg-brand-accent text-white hover:bg-brand-accent/90"
						>
							{failed > 0
								? `Retry ${plural(uploadable.length - done, "file")}`
								: uploadable.length > 1
									? `Upload ${plural(uploadable.length - done, "file")}`
									: "Upload"}
						</LoadingButton>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
