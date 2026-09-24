"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";

import { revokeShareAction, shareDocumentAction } from "@/app/portal/actions";
import { FormField } from "@/components/form/form-field";
import { LoadingButton } from "@/components/form/loading-button";
import { SelectField } from "@/components/form/select-field";
import { Badge } from "@/components/portal/ui";

const ACCESS_OPTIONS = [
	{ value: "view", label: "Can view" },
	{ value: "download", label: "Can view & download" },
];

export type ShareRow = {
	id: string;
	email: string;
	access: "view" | "download";
	status: "pending" | "accepted" | "revoked";
	expired: boolean;
};

export function SharePanel({
	documentId,
	shares,
}: {
	documentId: string;
	shares: ShareRow[];
}) {
	const [sending, setSending] = useState(false);
	const [revoking, setRevoking] = useState<string | null>(null);
	const visible = shares.filter((s) => s.status !== "revoked");

	async function share(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const form = event.currentTarget;
		const data = new FormData(form);
		setSending(true);
		const result = await shareDocumentAction(documentId, {
			email: String(data.get("email")),
			access: data.get("access") === "download" ? "download" : "view",
		});
		setSending(false);
		if (!result.ok) return toast.error(result.error);
		form.reset();
		toast.success("Invite sent.");
	}

	async function revoke(shareId: string) {
		setRevoking(shareId);
		const result = await revokeShareAction(shareId, documentId);
		setRevoking(null);
		if (!result.ok) toast.error(result.error);
	}

	return (
		<section className="rounded-lg border border-white/10 p-4">
			<h2 className="font-medium">Share</h2>
			<p className="mt-1 text-xs text-white/50">
				They&rsquo;ll get an email and can see the document once they accept.
			</p>
			<form onSubmit={share} className="mt-4 flex flex-col gap-3">
				<FormField
					id="share-email"
					name="email"
					label="Email"
					type="email"
					required
					placeholder="name@company.com"
				/>
				<SelectField
					id="share-access"
					name="access"
					label="Access"
					options={ACCESS_OPTIONS}
					defaultValue="view"
				/>
				<LoadingButton
					type="submit"
					loading={sending}
					className="h-10 rounded-lg bg-brand-accent text-white hover:bg-brand-accent/90"
				>
					Send invite
				</LoadingButton>
			</form>

			{visible.length > 0 ? (
				<ul className="mt-4 flex flex-col divide-y divide-white/5">
					{visible.map((s) => (
						<li key={s.id} className="flex items-center gap-2 py-2 text-sm">
							<div className="min-w-0 flex-1">
								<p className="truncate">{s.email}</p>
								<p className="text-xs text-white/50">
									{s.access === "download" ? "View & download" : "View only"}
								</p>
							</div>
							{s.status === "accepted" ? (
								<Badge tone="public">Accepted</Badge>
							) : s.expired ? (
								<Badge tone="warning">Expired</Badge>
							) : (
								<Badge>Pending</Badge>
							)}
							<button
								type="button"
								onClick={() => revoke(s.id)}
								disabled={revoking === s.id}
								className="inline-flex size-7 cursor-pointer items-center justify-center rounded-lg text-white/50 hover:bg-white/10 hover:text-white disabled:opacity-50"
								aria-label={`Remove access for ${s.email}`}
							>
								<X className="size-4" aria-hidden />
							</button>
						</li>
					))}
				</ul>
			) : null}
		</section>
	);
}
