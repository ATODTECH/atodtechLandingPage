"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Upload, XCircle } from "lucide-react";
import { toast } from "sonner";

import { confirmUploadAction, requestUploadAction } from "@/app/portal/actions";
import { LoadingButton } from "@/components/form/loading-button";
import { NativeSelect, dialogClassName } from "@/components/portal/ui";
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
import { formatBytes } from "@/lib/dms/format";

// Browsers leave file.type empty for some extensions.
const EXTENSION_TYPES: Record<string, string> = {
	md: "text/markdown",
	csv: "text/csv",
	json: "application/json",
	docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
	xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
};

function mimeTypeOf(file: File) {
	if (file.type) return file.type;
	const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
	return EXTENSION_TYPES[ext] ?? "application/octet-stream";
}

/** PUTs the file straight to Spaces, reporting progress (fetch can't). */
function putFile(
	url: string,
	file: File,
	contentType: string,
	onProgress: (fraction: number) => void,
) {
	return new Promise<void>((resolve, reject) => {
		const xhr = new XMLHttpRequest();
		xhr.open("PUT", url);
		xhr.setRequestHeader("Content-Type", contentType);
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
		xhr.send(file);
	});
}

type FileState = {
	file: File;
	progress: number;
	status: "queued" | "uploading" | "done" | "error";
	error?: string;
};

export function UploadDialog({
	clients,
	defaultClientId,
}: {
	clients: { id: string; name: string }[];
	defaultClientId?: string;
}) {
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const [clientId, setClientId] = useState(defaultClientId ?? "");
	const [files, setFiles] = useState<FileState[]>([]);
	const [uploading, setUploading] = useState(false);

	const update = (index: number, patch: Partial<FileState>) =>
		setFiles((prev) =>
			prev.map((f, i) => (i === index ? { ...f, ...patch } : f)),
		);

	async function uploadAll() {
		setUploading(true);
		let succeeded = 0;

		for (const [index, { file, status }] of files.entries()) {
			if (status === "done") continue;
			update(index, { status: "uploading", progress: 0, error: undefined });
			const mimeType = mimeTypeOf(file);

			try {
				const requested = await requestUploadAction({
					clientId,
					fileName: file.name,
					mimeType,
					sizeBytes: file.size,
				});
				if (!requested.ok) throw new Error(requested.error);

				await putFile(requested.data.uploadUrl, file, mimeType, (progress) =>
					update(index, { progress }),
				);

				const confirmed = await confirmUploadAction(requested.data.documentId);
				if (!confirmed.ok) throw new Error(confirmed.error);

				update(index, { status: "done", progress: 1 });
				succeeded++;
			} catch (error) {
				update(index, {
					status: "error",
					error: error instanceof Error ? error.message : "Upload failed.",
				});
			}
		}

		setUploading(false);
		router.refresh();
		if (succeeded > 0) {
			toast.success(
				succeeded === 1 ? "Document uploaded." : `${succeeded} documents uploaded.`,
			);
		}
	}

	const allDone = files.length > 0 && files.every((f) => f.status === "done");

	return (
		<Dialog
			open={open}
			onOpenChange={(next) => {
				if (uploading) return;
				setOpen(next);
				if (!next) setFiles([]);
			}}
		>
			<DialogTrigger
				render={
					<Button className="h-9 cursor-pointer rounded-full bg-brand-accent px-4 text-white hover:bg-brand-accent/90" />
				}
			>
				<Upload aria-hidden />
				Upload
			</DialogTrigger>
			<DialogContent className={dialogClassName}>
				<DialogHeader>
					<DialogTitle>Upload documents</DialogTitle>
					<DialogDescription>
						New documents are private until you share them or make them public.
						Max 100 MB each.
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
					<div className="flex flex-col gap-4">
						<div className="flex flex-col gap-2">
							<Label htmlFor="upload-client">Client</Label>
							<NativeSelect
								id="upload-client"
								value={clientId}
								onChange={(e) => setClientId(e.target.value)}
								disabled={uploading}
							>
								<option value="" disabled>
									Choose a client…
								</option>
								{clients.map((c) => (
									<option key={c.id} value={c.id}>
										{c.name}
									</option>
								))}
							</NativeSelect>
						</div>

						<div className="flex flex-col gap-2">
							<Label htmlFor="upload-files">Files</Label>
							<input
								id="upload-files"
								type="file"
								multiple
								disabled={uploading}
								onChange={(e) =>
									setFiles(
										Array.from(e.target.files ?? []).map((file) => ({
											file,
											progress: 0,
											status: "queued",
										})),
									)
								}
								className="text-sm text-white/70 file:mr-3 file:cursor-pointer file:rounded-full file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-sm file:text-white hover:file:bg-white/15"
							/>
						</div>

						{files.length > 0 ? (
							<ul className="flex max-h-56 flex-col gap-2 overflow-y-auto">
								{files.map((f, i) => (
									<li
										key={`${f.file.name}-${i}`}
										className="rounded-lg border border-white/10 px-3 py-2"
									>
										<div className="flex items-center gap-2 text-sm">
											<span className="min-w-0 flex-1 truncate">{f.file.name}</span>
											<span className="shrink-0 text-xs text-white/50">
												{formatBytes(f.file.size)}
											</span>
											{f.status === "done" ? (
												<CheckCircle2 className="size-4 text-emerald-400" aria-label="Uploaded" />
											) : f.status === "error" ? (
												<XCircle className="size-4 text-destructive" aria-label="Failed" />
											) : null}
										</div>
										{f.status === "uploading" ? (
											<div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
												<div
													className="h-full bg-brand-accent transition-[width]"
													style={{ width: `${Math.round(f.progress * 100)}%` }}
												/>
											</div>
										) : null}
										{f.error ? (
											<p className="mt-1 text-xs text-destructive">{f.error}</p>
										) : null}
									</li>
								))}
							</ul>
						) : null}
					</div>
				)}

				<DialogFooter className="border-white/10 bg-white/5">
					{allDone ? (
						<Button
							className="cursor-pointer rounded-full"
							onClick={() => setOpen(false)}
						>
							Done
						</Button>
					) : (
						<LoadingButton
							loading={uploading}
							loadingText="Uploading…"
							disabled={!clientId || files.length === 0}
							onClick={uploadAll}
							className="rounded-full bg-brand-accent text-white hover:bg-brand-accent/90"
						>
							{files.length > 1 ? `Upload ${files.length} files` : "Upload"}
						</LoadingButton>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
