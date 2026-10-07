"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Globe, Lock, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
	deleteDocumentAction,
	renameDocumentAction,
	setVisibilityAction,
} from "@/app/portal/actions";
import { FormField } from "@/components/form/form-field";
import { LoadingButton } from "@/components/form/loading-button";
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

const actionButton =
	"h-9 w-full cursor-pointer justify-start gap-2 rounded-lg border-white/15 bg-white/5 px-3 text-white hover:bg-white/10";

export function DocumentActions({
	id,
	name,
	visibility,
	canRename,
	canChangeVisibility,
	canDelete,
}: {
	id: string;
	name: string;
	visibility: "private" | "public";
	canRename: boolean;
	canChangeVisibility: boolean;
	canDelete: boolean;
}) {
	const router = useRouter();
	const [renameOpen, setRenameOpen] = useState(false);
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [busy, setBusy] = useState<"rename" | "visibility" | "delete" | null>(
		null,
	);

	async function rename(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setBusy("rename");
		const result = await renameDocumentAction(
			id,
			String(new FormData(event.currentTarget).get("name")),
		);
		setBusy(null);
		if (!result.ok) return toast.error(result.error);
		setRenameOpen(false);
		toast.success("Document renamed.");
	}

	async function toggleVisibility() {
		const next = visibility === "public" ? "private" : "public";
		setBusy("visibility");
		const result = await setVisibilityAction(id, next);
		setBusy(null);
		if (!result.ok) return toast.error(result.error);
		toast.success(
			next === "public"
				? "Anyone signed in can now see this document."
				: "Only people it's shared with can see this document now.",
		);
	}

	async function remove() {
		setBusy("delete");
		const result = await deleteDocumentAction(id);
		if (!result.ok) {
			setBusy(null);
			return toast.error(result.error);
		}
		toast.success("Document deleted.");
		router.replace("/portal");
	}

	if (!canRename && !canChangeVisibility && !canDelete) return null;

	return (
		<div className="flex flex-col gap-2">
			{canChangeVisibility ? (
				<LoadingButton
					variant="outline"
					loading={busy === "visibility"}
					onClick={toggleVisibility}
					className={actionButton}
				>
					{visibility === "public" ? (
						<>
							<Lock aria-hidden /> Make private
						</>
					) : (
						<>
							<Globe aria-hidden /> Make public
						</>
					)}
				</LoadingButton>
			) : null}

			{canRename ? (
				<Dialog open={renameOpen} onOpenChange={setRenameOpen}>
					<DialogTrigger render={<Button variant="outline" className={actionButton} />}>
						<Pencil aria-hidden /> Rename
					</DialogTrigger>
					<DialogContent className={dialogClassName}>
						<form onSubmit={rename} className="flex flex-col gap-4">
							<DialogHeader>
								<DialogTitle>Rename document</DialogTitle>
							</DialogHeader>
							<FormField
								id="rename-document"
								name="name"
								label="Document name"
								defaultValue={name}
								required
								maxLength={255}
								autoFocus
							/>
							<DialogFooter className="rounded-b-lg border-white/10 bg-white/5">
								<LoadingButton
									type="submit"
									loading={busy === "rename"}
									className="rounded-lg bg-brand-accent text-white hover:bg-brand-accent/90"
								>
									Save
								</LoadingButton>
							</DialogFooter>
						</form>
					</DialogContent>
				</Dialog>
			) : null}

			{canDelete ? (
				<Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
					<DialogTrigger
						render={
							<Button
								variant="outline"
								className={`${actionButton} text-red-300 hover:text-red-200`}
							/>
						}
					>
						<Trash2 aria-hidden /> Delete
					</DialogTrigger>
					<DialogContent className={dialogClassName}>
						<DialogHeader>
							<DialogTitle>Delete this document?</DialogTitle>
							<DialogDescription>
								&ldquo;{name}&rdquo; will be permanently removed and everyone
								it&rsquo;s shared with will lose access. This can&rsquo;t be undone.
							</DialogDescription>
						</DialogHeader>
						<DialogFooter className="rounded-b-lg border-white/10 bg-white/5">
							<Button
								variant="outline"
								className="cursor-pointer rounded-lg"
								onClick={() => setDeleteOpen(false)}
							>
								Cancel
							</Button>
							<LoadingButton
								variant="destructive"
								loading={busy === "delete"}
								onClick={remove}
								className="rounded-lg"
							>
								Delete document
							</LoadingButton>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			) : null}
		</div>
	);
}
