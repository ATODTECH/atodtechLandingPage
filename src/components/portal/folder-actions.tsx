"use client";

import { Download, UserPlus } from "lucide-react";

import { SharePanel, type ShareRow } from "@/components/portal/share-panel";
import { dialogClassName } from "@/components/portal/ui";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";

const secondaryButton =
	"inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-4 text-sm font-medium text-white hover:bg-white/10";

/** Header buttons for an open folder: download it as a zip, and share it. */
export function FolderActions({
	folderId,
	name,
	canDownload,
	shares,
}: {
	folderId: string;
	name: string;
	canDownload: boolean;
	/** Null when the actor can't share. */
	shares: ShareRow[] | null;
}) {
	return (
		<>
			{canDownload ? (
				<a href={`/portal/folders/${folderId}/download`} className={secondaryButton}>
					<Download className="size-4" aria-hidden /> Download folder
				</a>
			) : null}
			{shares ? (
				<Dialog>
					<DialogTrigger render={<Button variant="outline" className={secondaryButton} />}>
						<UserPlus aria-hidden /> Share folder
						{shares.some((s) => s.status !== "revoked") ? (
							<span className="rounded-lg bg-white/10 px-1.5 text-xs">
								{shares.filter((s) => s.status !== "revoked").length}
							</span>
						) : null}
					</DialogTrigger>
					<DialogContent className={dialogClassName}>
						<DialogHeader>
							<DialogTitle>Share &ldquo;{name}&rdquo;</DialogTitle>
							<DialogDescription>
								They&rsquo;ll get an email and, once they accept, can see
								everything in this folder and its subfolders, including files
								added later.
							</DialogDescription>
						</DialogHeader>
						<SharePanel folderId={folderId} shares={shares} bare />
					</DialogContent>
				</Dialog>
			) : null}
		</>
	);
}
