"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import {
	createClientAction,
	deleteClientAction,
	renameClientAction,
} from "@/app/portal/actions";
import { FormField } from "@/components/form/form-field";
import { LoadingButton } from "@/components/form/loading-button";
import { EmptyState } from "@/components/portal/ui";
import { formatDate } from "@/lib/dms/format";

type ClientRow = {
	id: string;
	name: string;
	createdAt: Date;
	documentCount: number;
};

const iconButton =
	"inline-flex size-8 cursor-pointer items-center justify-center rounded-lg text-white/60 hover:bg-white/10 hover:text-white disabled:opacity-50";

export function ClientManager({
	clients,
	canManage,
}: {
	clients: ClientRow[];
	canManage: boolean;
}) {
	const [creating, setCreating] = useState(false);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [busyId, setBusyId] = useState<string | null>(null);

	async function create(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const form = event.currentTarget;
		setCreating(true);
		const result = await createClientAction(String(new FormData(form).get("name")));
		setCreating(false);
		if (!result.ok) return toast.error(result.error);
		form.reset();
		toast.success(`Added ${result.data.name}.`);
	}

	async function rename(event: React.FormEvent<HTMLFormElement>, id: string) {
		event.preventDefault();
		setBusyId(id);
		const result = await renameClientAction(
			id,
			String(new FormData(event.currentTarget).get("name")),
		);
		setBusyId(null);
		if (!result.ok) return toast.error(result.error);
		setEditingId(null);
	}

	async function remove(client: ClientRow) {
		if (!window.confirm(`Delete ${client.name}? This can't be undone.`)) return;
		setBusyId(client.id);
		const result = await deleteClientAction(client.id);
		setBusyId(null);
		if (!result.ok) return toast.error(result.error);
		toast.success(`Deleted ${client.name}.`);
	}

	return (
		<>
			{canManage ? (
				<form onSubmit={create} className="mb-6 flex max-w-md items-end gap-2">
					<FormField
						id="new-client"
						name="name"
						label="New client name"
						labelClassName="sr-only"
						className="flex-1"
						required
						maxLength={120}
						placeholder="Client name, e.g. Kiddiedu"
					/>
					<LoadingButton
						type="submit"
						loading={creating}
						className="h-11.5 rounded-lg bg-brand-accent px-4 text-white hover:bg-brand-accent/90"
					>
						<Plus aria-hidden /> Add
					</LoadingButton>
				</form>
			) : null}

			{clients.length === 0 ? (
				<EmptyState title="No clients yet">
					{canManage
						? "Add the companies you build for, then upload their documents."
						: "An admin with client access can add clients."}
				</EmptyState>
			) : (
				<ul className="divide-y divide-white/5 overflow-hidden rounded-lg border border-white/10">
					{clients.map((c) => (
						<li key={c.id} className="flex items-center gap-3 px-4 py-3">
							{editingId === c.id ? (
								<form
									onSubmit={(e) => rename(e, c.id)}
									className="flex flex-1 items-center gap-2"
								>
									<FormField
										id={`client-name-${c.id}`}
										name="name"
										label="Client name"
										labelClassName="sr-only"
										className="flex-1"
										fieldClassName="h-9"
										defaultValue={c.name}
										required
										maxLength={120}
										autoFocus
									/>
									<button
										type="submit"
										disabled={busyId === c.id}
										className={iconButton}
										aria-label="Save"
									>
										<Check className="size-4" aria-hidden />
									</button>
									<button
										type="button"
										onClick={() => setEditingId(null)}
										className={iconButton}
										aria-label="Cancel"
									>
										<X className="size-4" aria-hidden />
									</button>
								</form>
							) : (
								<>
									<div className="min-w-0 flex-1">
										<Link
											href={`/portal?client=${c.id}`}
											className="font-medium hover:underline"
										>
											{c.name}
										</Link>
										<p className="text-xs text-white/50">
											{c.documentCount}{" "}
											{c.documentCount === 1 ? "document" : "documents"} · Added{" "}
											{formatDate(c.createdAt)}
										</p>
									</div>
									{canManage ? (
										<>
											<button
												type="button"
												onClick={() => setEditingId(c.id)}
												className={iconButton}
												aria-label={`Rename ${c.name}`}
											>
												<Pencil className="size-4" aria-hidden />
											</button>
											<button
												type="button"
												onClick={() => remove(c)}
												disabled={busyId === c.id || c.documentCount > 0}
												title={
													c.documentCount > 0
														? "Delete this client's documents first"
														: undefined
												}
												className={`${iconButton} hover:text-red-300`}
												aria-label={`Delete ${c.name}`}
											>
												<Trash2 className="size-4" aria-hidden />
											</button>
										</>
									) : null}
								</>
							)}
						</li>
					))}
				</ul>
			)}
		</>
	);
}
