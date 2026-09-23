"use client";

import { useState } from "react";
import { MailPlus, ShieldCheck, ShieldOff, X } from "lucide-react";
import { toast } from "sonner";

import {
	inviteUserAction,
	removeAdminAction,
	revokeInviteAction,
	setAdminRightsAction,
} from "@/app/portal/actions";
import { LoadingButton } from "@/components/form/loading-button";
import { Badge, NativeSelect, dialogClassName } from "@/components/portal/ui";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AdminRights } from "@/lib/db/schema";
import { formatDate, RIGHT_LABELS } from "@/lib/dms/format";

type Right = keyof AdminRights;
const RIGHTS = Object.keys(RIGHT_LABELS) as Right[];
const NONE = Object.fromEntries(RIGHTS.map((r) => [r, false])) as AdminRights;

type TeamUser = {
	id: string;
	name: string;
	email: string;
	role: string;
	createdAt: Date;
	rights: AdminRights;
};
type TeamInvite = {
	id: string;
	email: string;
	role: "admin" | "client";
	expiresAt: Date;
};

/** Checkboxes for admin rights. Rights the current user lacks can't be granted. */
function RightsPicker({
	value,
	onChange,
	grantable,
}: {
	value: AdminRights;
	onChange: (value: AdminRights) => void;
	grantable: AdminRights;
}) {
	const allOn = RIGHTS.filter((r) => grantable[r]).every((r) => value[r]);
	return (
		<fieldset className="flex flex-col gap-2">
			<legend className="mb-2 flex w-full items-center justify-between text-sm font-medium">
				Rights
				<button
					type="button"
					className="cursor-pointer text-xs font-normal text-brand-accent hover:underline"
					onClick={() =>
						onChange(
							Object.fromEntries(
								RIGHTS.map((r) => [r, !allOn && grantable[r]]),
							) as AdminRights,
						)
					}
				>
					{allOn ? "Clear all" : "Full access"}
				</button>
			</legend>
			{RIGHTS.map((right) => (
				<label
					key={right}
					className={`flex items-center gap-2 text-sm ${grantable[right] ? "cursor-pointer" : "opacity-40"}`}
				>
					<input
						type="checkbox"
						checked={value[right]}
						disabled={!grantable[right]}
						onChange={(e) => onChange({ ...value, [right]: e.target.checked })}
						className="size-4 accent-[#f56f46]"
					/>
					{RIGHT_LABELS[right]}
				</label>
			))}
		</fieldset>
	);
}

export function TeamManager({
	users,
	invites,
	currentUserId,
	grantable,
}: {
	users: TeamUser[];
	invites: TeamInvite[];
	currentUserId: string;
	grantable: AdminRights;
}) {
	const [inviteRole, setInviteRole] = useState<"admin" | "client">("client");
	const [inviteRights, setInviteRights] = useState<AdminRights>(NONE);
	const [inviting, setInviting] = useState(false);
	const [editing, setEditing] = useState<TeamUser | null>(null);
	const [editRights, setEditRights] = useState<AdminRights>(NONE);
	const [busy, setBusy] = useState<string | null>(null);

	async function invite(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const form = event.currentTarget;
		setInviting(true);
		const result = await inviteUserAction({
			email: String(new FormData(form).get("email")),
			role: inviteRole,
			adminRights: inviteRole === "admin" ? inviteRights : undefined,
		});
		setInviting(false);
		if (!result.ok) return toast.error(result.error);
		form.reset();
		setInviteRights(NONE);
		toast.success("Invite sent.");
	}

	function openEditor(user: TeamUser) {
		setEditing(user);
		setEditRights(user.rights);
	}

	async function saveRights() {
		if (!editing) return;
		setBusy(editing.id);
		const result = await setAdminRightsAction(editing.id, editRights);
		setBusy(null);
		if (!result.ok) return toast.error(result.error);
		toast.success(
			editing.role === "admin"
				? `Updated ${editing.name}'s rights.`
				: `${editing.name} is now an admin.`,
		);
		setEditing(null);
	}

	async function removeAdmin(user: TeamUser) {
		if (!window.confirm(`Remove ${user.name} as an admin? They'll keep client access.`)) {
			return;
		}
		setBusy(user.id);
		const result = await removeAdminAction(user.id);
		setBusy(null);
		if (!result.ok) return toast.error(result.error);
		toast.success(`${user.name} is no longer an admin.`);
	}

	async function revokeInvite(id: string) {
		setBusy(id);
		const result = await revokeInviteAction(id);
		setBusy(null);
		if (!result.ok) toast.error(result.error);
	}

	return (
		<div className="grid gap-6 lg:grid-cols-[1fr_340px]">
			<section className="flex flex-col gap-6">
				<ul className="divide-y divide-white/5 overflow-hidden rounded-xl border border-white/10">
					{users.map((u) => {
						const editable = u.id !== currentUserId && u.role !== "owner";
						const granted = RIGHTS.filter((r) => u.rights[r]);
						return (
							<li key={u.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center">
								<div className="min-w-0 flex-1">
									<p className="flex items-center gap-2 font-medium">
										<span className="truncate">{u.name}</span>
										{u.role === "owner" ? (
											<Badge tone="accent">Owner</Badge>
										) : u.role === "admin" ? (
											<Badge tone="public">Admin</Badge>
										) : (
											<Badge>Client</Badge>
										)}
										{u.id === currentUserId ? (
											<span className="text-xs text-white/40">(you)</span>
										) : null}
									</p>
									<p className="truncate text-xs text-white/50">
										{u.email} · Joined {formatDate(u.createdAt)}
									</p>
									{u.role === "admin" ? (
										<p className="mt-1 text-xs text-white/60">
											{granted.length === RIGHTS.length
												? "Full access"
												: granted.length === 0
													? "No rights yet"
													: granted.map((r) => RIGHT_LABELS[r]).join(" · ")}
										</p>
									) : null}
								</div>
								{editable ? (
									<div className="flex shrink-0 gap-1">
										<Button
											variant="ghost"
											size="sm"
											className="cursor-pointer"
											onClick={() => openEditor(u)}
										>
											<ShieldCheck aria-hidden />
											{u.role === "admin" ? "Edit rights" : "Make admin"}
										</Button>
										{u.role === "admin" ? (
											<Button
												variant="ghost"
												size="sm"
												className="cursor-pointer text-red-300 hover:text-red-200"
												disabled={busy === u.id}
												onClick={() => removeAdmin(u)}
											>
												<ShieldOff aria-hidden /> Remove
											</Button>
										) : null}
									</div>
								) : null}
							</li>
						);
					})}
				</ul>

				{invites.length > 0 ? (
					<div>
						<h2 className="mb-2 text-sm font-medium text-white/70">Pending invites</h2>
						<ul className="divide-y divide-white/5 overflow-hidden rounded-xl border border-white/10">
							{invites.map((i) => (
								<li key={i.id} className="flex items-center gap-3 px-4 py-3 text-sm">
									<div className="min-w-0 flex-1">
										<p className="truncate">{i.email}</p>
										<p className="text-xs text-white/50">
											{i.role === "admin" ? "Admin" : "Client"} · Expires{" "}
											{formatDate(i.expiresAt)}
										</p>
									</div>
									<button
										type="button"
										onClick={() => revokeInvite(i.id)}
										disabled={busy === i.id}
										className="inline-flex size-8 cursor-pointer items-center justify-center rounded-lg text-white/50 hover:bg-white/10 hover:text-white disabled:opacity-50"
										aria-label={`Cancel invite for ${i.email}`}
									>
										<X className="size-4" aria-hidden />
									</button>
								</li>
							))}
						</ul>
					</div>
				) : null}
			</section>

			<section className="h-fit rounded-xl border border-white/10 p-4">
				<h2 className="flex items-center gap-2 font-medium">
					<MailPlus className="size-4" aria-hidden /> Invite someone
				</h2>
				<form onSubmit={invite} className="mt-4 flex flex-col gap-4">
					<div className="flex flex-col gap-2">
						<Label htmlFor="invite-email">Email</Label>
						<Input
							id="invite-email"
							name="email"
							type="email"
							required
							placeholder="name@company.com"
							className="h-9"
						/>
					</div>
					<div className="flex flex-col gap-2">
						<Label htmlFor="invite-role">Role</Label>
						<NativeSelect
							id="invite-role"
							value={inviteRole}
							onChange={(e) => setInviteRole(e.target.value as "admin" | "client")}
						>
							<option value="client">Client (view & download only)</option>
							<option value="admin">Admin</option>
						</NativeSelect>
					</div>
					{inviteRole === "admin" ? (
						<RightsPicker
							value={inviteRights}
							onChange={setInviteRights}
							grantable={grantable}
						/>
					) : null}
					<LoadingButton
						type="submit"
						loading={inviting}
						className="h-9 rounded-full bg-brand-accent text-white hover:bg-brand-accent/90"
					>
						Send invite
					</LoadingButton>
				</form>
			</section>

			<Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
				<DialogContent className={dialogClassName}>
					<DialogHeader>
						<DialogTitle>
							{editing?.role === "admin" ? "Edit admin rights" : "Make admin"}
						</DialogTitle>
						<DialogDescription>
							{editing?.name} ({editing?.email})
						</DialogDescription>
					</DialogHeader>
					<RightsPicker value={editRights} onChange={setEditRights} grantable={grantable} />
					<DialogFooter className="border-white/10 bg-white/5">
						<LoadingButton
							loading={busy === editing?.id}
							onClick={saveRights}
							className="rounded-full bg-brand-accent text-white hover:bg-brand-accent/90"
						>
							Save
						</LoadingButton>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
