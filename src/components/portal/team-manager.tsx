"use client";

import { useState } from "react";
import Link from "next/link";
import {
	Building2,
	MailPlus,
	ShieldCheck,
	ShieldOff,
	Trash2,
	X,
} from "lucide-react";
import { toast } from "sonner";

import {
	inviteUserAction,
	removeAdminAction,
	removeUserAction,
	revokeInviteAction,
	setAdminRightsAction,
	setClientMembershipsAction,
} from "@/app/portal/actions";
import { FormField } from "@/components/form/form-field";
import { LoadingButton } from "@/components/form/loading-button";
import { SelectField } from "@/components/form/select-field";
import { Badge, dialogClassName } from "@/components/portal/ui";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import type { AdminRights } from "@/lib/db/schema";
import { formatDate, RIGHT_LABELS } from "@/lib/dms/format";

type Right = keyof AdminRights;
const RIGHTS = Object.keys(RIGHT_LABELS) as Right[];
const ROLE_OPTIONS = [
	{ value: "client", label: "Client (view, download & upload)" },
	{ value: "admin", label: "Admin" },
];
const NONE = Object.fromEntries(RIGHTS.map((r) => [r, false])) as AdminRights;

type TeamUser = {
	id: string;
	name: string;
	email: string;
	role: string;
	createdAt: Date;
	rights: AdminRights;
	clients: { id: string; name: string }[];
};
type TeamInvite = {
	id: string;
	email: string;
	role: "admin" | "client";
	expiresAt: Date;
	clientName: string | null;
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
						onChange={(e) =>
							onChange({ ...value, [right]: e.target.checked })
						}
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
	canRemoveUsers,
	clients,
}: {
	users: TeamUser[];
	invites: TeamInvite[];
	/** Every client company, for invites and memberships. */
	clients: { id: string; name: string }[];
	currentUserId: string;
	grantable: AdminRights;
	/** Only the owner can delete people. */
	canRemoveUsers: boolean;
}) {
	const [inviteRole, setInviteRole] = useState<"admin" | "client">("client");
	const [inviteRights, setInviteRights] = useState<AdminRights>(NONE);
	const [inviting, setInviting] = useState(false);
	const [editing, setEditing] = useState<TeamUser | null>(null);
	const [editRights, setEditRights] = useState<AdminRights>(NONE);
	const [busy, setBusy] = useState<string | null>(null);
	const [removing, setRemoving] = useState<TeamUser | null>(null);
	const [removePending, setRemovePending] = useState(false);
	const [inviteClientId, setInviteClientId] = useState("");
	const [companiesFor, setCompaniesFor] = useState<TeamUser | null>(null);
	const [companySelection, setCompanySelection] = useState<string[]>([]);
	const [savingCompanies, setSavingCompanies] = useState(false);
	const clientOptions = clients.map((c) => ({ value: c.id, label: c.name }));

	async function invite(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const form = event.currentTarget;
		setInviting(true);
		const result = await inviteUserAction({
			email: String(new FormData(form).get("email")),
			role: inviteRole,
			adminRights: inviteRole === "admin" ? inviteRights : undefined,
			clientId: inviteRole === "client" ? inviteClientId : undefined,
		});
		setInviting(false);
		if (!result.ok) return toast.error(result.error);
		form.reset();
		setInviteRights(NONE);
		setInviteClientId("");
		toast.success("Invite sent.");
	}

	function openCompanies(user: TeamUser) {
		setCompaniesFor(user);
		setCompanySelection(user.clients.map((c) => c.id));
	}

	async function saveCompanies() {
		if (!companiesFor) return;
		setSavingCompanies(true);
		const result = await setClientMembershipsAction(
			companiesFor.id,
			companySelection,
		);
		setSavingCompanies(false);
		if (!result.ok) return toast.error(result.error);
		toast.success(`Updated ${companiesFor.name}'s clients.`);
		setCompaniesFor(null);
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
		if (
			!window.confirm(
				`Remove ${user.name} as an admin? They'll keep client access.`,
			)
		) {
			return;
		}
		setBusy(user.id);
		const result = await removeAdminAction(user.id);
		setBusy(null);
		if (!result.ok) return toast.error(result.error);
		toast.success(`${user.name} is no longer an admin.`);
	}

	async function removeUser() {
		if (!removing) return;
		setRemovePending(true);
		const result = await removeUserAction(removing.id);
		setRemovePending(false);
		if (!result.ok) return toast.error(result.error);
		toast.success(`${removing.name} has been removed.`);
		setRemoving(null);
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
				<ul className="divide-y divide-white/5 overflow-hidden rounded-lg border border-white/10">
					{users.map((u) => {
						const editable =
							u.id !== currentUserId && u.role !== "owner";
						const granted = RIGHTS.filter((r) => u.rights[r]);
						return (
							<li
								key={u.id}
								className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center"
							>
								<div className="min-w-0 flex-1">
									<p className="flex items-center gap-2 font-medium">
										<span className="truncate">
											{u.name}
										</span>
										{u.role === "owner" ? (
											<Badge tone="accent">Owner</Badge>
										) : u.role === "admin" ? (
											<Badge tone="public">Admin</Badge>
										) : (
											<Badge>Client</Badge>
										)}
										{u.id === currentUserId ? (
											<span className="text-xs text-white/40">
												(you)
											</span>
										) : null}
									</p>
									<p className="truncate text-xs text-white/50">
										{u.email} · Joined{" "}
										{formatDate(u.createdAt)}
									</p>
									{u.role === "client" ? (
										<p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs">
											{u.clients.length > 0 ? (
												u.clients.map((c) => (
													<Badge key={c.id}>
														<Building2 className="size-3" aria-hidden />
														{c.name}
													</Badge>
												))
											) : (
												<span className="text-amber-300/80">
													Not in a client yet: can&rsquo;t upload
												</span>
											)}
										</p>
									) : null}
									{u.role === "admin" ? (
										<p className="mt-1 text-xs text-white/60">
											{granted.length === RIGHTS.length
												? "Full access"
												: granted.length === 0
													? "No rights yet"
													: granted
															.map(
																(r) =>
																	RIGHT_LABELS[
																		r
																	],
															)
															.join(" · ")}
										</p>
									) : null}
								</div>
								{editable ? (
									<div className="flex shrink-0 flex-wrap gap-1">
										{u.role === "client" ? (
											<Button
												variant="ghost"
												size="sm"
												className="cursor-pointer"
												onClick={() => openCompanies(u)}
											>
												<Building2 aria-hidden /> Clients
											</Button>
										) : null}
										<Button
											variant="ghost"
											size="sm"
											className="cursor-pointer"
											onClick={() => openEditor(u)}
										>
											<ShieldCheck aria-hidden />
											{u.role === "admin"
												? "Edit rights"
												: "Make admin"}
										</Button>
										{u.role === "admin" ? (
											<Button
												variant="ghost"
												size="sm"
												className="cursor-pointer text-red-300 hover:text-red-200"
												disabled={busy === u.id}
												onClick={() => removeAdmin(u)}
											>
												<ShieldOff aria-hidden /> Revoke admin
											</Button>
										) : null}
										{canRemoveUsers ? (
											<Button
												variant="ghost"
												size="sm"
												className="cursor-pointer text-red-300 hover:text-red-200"
												onClick={() => setRemoving(u)}
											>
												<Trash2 aria-hidden /> Remove
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
						<h2 className="mb-2 text-sm font-medium text-white/70">
							Pending invites
						</h2>
						<ul className="divide-y divide-white/5 overflow-hidden rounded-lg border border-white/10">
							{invites.map((i) => (
								<li
									key={i.id}
									className="flex items-center gap-3 px-4 py-3 text-sm"
								>
									<div className="min-w-0 flex-1">
										<p className="truncate">{i.email}</p>
										<p className="text-xs text-white/50">
											{i.role === "admin"
												? "Admin"
												: `Client${i.clientName ? ` at ${i.clientName}` : ""}`}{" "}
											· Expires {formatDate(i.expiresAt)}
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

			<section className="h-fit rounded-lg border border-white/10 p-4">
				<h2 className="flex items-center gap-2 font-medium">
					<MailPlus className="size-4" aria-hidden /> Invite someone
				</h2>
				<form onSubmit={invite} className="mt-4 flex flex-col gap-4">
					<FormField
						id="invite-email"
						name="email"
						label="Email"
						type="email"
						required
						placeholder="name@company.com"
					/>
					<SelectField
						id="invite-role"
						label="Role"
						options={ROLE_OPTIONS}
						value={inviteRole}
						onValueChange={(value) =>
							setInviteRole(value as "admin" | "client")
						}
					/>
					{inviteRole === "admin" ? (
						<RightsPicker
							value={inviteRights}
							onChange={setInviteRights}
							grantable={grantable}
						/>
					) : clients.length > 0 ? (
						<SelectField
							id="invite-client"
							label="Client"
							placeholder="Which client do they work for?"
							options={clientOptions}
							value={inviteClientId}
							onValueChange={setInviteClientId}
							required
						/>
					) : (
						<p className="text-sm text-white/60">
							Add a client first so the person can be added to it.{" "}
							<Link href="/portal/clients" className="text-brand-accent hover:underline">
								Go to clients
							</Link>
						</p>
					)}
					<LoadingButton
						type="submit"
						loading={inviting}
						disabled={inviteRole === "client" && !inviteClientId}
						className="h-11 rounded-lg bg-brand-accent text-white hover:bg-brand-accent/90"
					>
						Send invite
					</LoadingButton>
				</form>
			</section>

			<Dialog
				open={companiesFor !== null}
				onOpenChange={(open) => !open && !savingCompanies && setCompaniesFor(null)}
			>
				<DialogContent className={dialogClassName}>
					<DialogHeader>
						<DialogTitle>Clients for {companiesFor?.name}</DialogTitle>
						<DialogDescription>
							They can upload to these clients&rsquo; folders and see what
							others at the same client upload.
						</DialogDescription>
					</DialogHeader>
					{clients.length === 0 ? (
						<p className="text-sm text-white/60">No clients yet.</p>
					) : (
						<fieldset className="flex max-h-64 flex-col gap-2 overflow-y-auto">
							<legend className="sr-only">Clients</legend>
							{clients.map((c) => (
								<label
									key={c.id}
									className="flex cursor-pointer items-center gap-2 text-sm"
								>
									<input
										type="checkbox"
										checked={companySelection.includes(c.id)}
										onChange={(e) =>
											setCompanySelection((prev) =>
												e.target.checked
													? [...prev, c.id]
													: prev.filter((id) => id !== c.id),
											)
										}
										className="size-4 accent-[#f56f46]"
									/>
									{c.name}
								</label>
							))}
						</fieldset>
					)}
					<DialogFooter className="rounded-b-lg border-white/10 bg-white/5">
						<LoadingButton
							loading={savingCompanies}
							onClick={saveCompanies}
							className="rounded-lg bg-brand-accent text-white hover:bg-brand-accent/90"
						>
							Save
						</LoadingButton>
					</DialogFooter>
				</DialogContent>
			</Dialog>
			<Dialog
				open={editing !== null}
				onOpenChange={(open) => !open && setEditing(null)}
			>
				<DialogContent className={dialogClassName}>
					<DialogHeader>
						<DialogTitle>
							{editing?.role === "admin"
								? "Edit admin rights"
								: "Make admin"}
						</DialogTitle>
						<DialogDescription>
							{editing?.name} ({editing?.email})
						</DialogDescription>
					</DialogHeader>
					<RightsPicker
						value={editRights}
						onChange={setEditRights}
						grantable={grantable}
					/>
					<DialogFooter className="rounded-b-lg border-white/10 bg-white/5">
						<LoadingButton
							loading={busy === editing?.id}
							onClick={saveRights}
							className="rounded-lg bg-brand-accent text-white hover:bg-brand-accent/90"
						>
							Save
						</LoadingButton>
					</DialogFooter>
				</DialogContent>
			</Dialog>
			<Dialog
				open={removing !== null}
				onOpenChange={(open) => !open && !removePending && setRemoving(null)}
			>
				<DialogContent className={dialogClassName} showCloseButton={!removePending}>
					<DialogHeader>
						<DialogTitle>Remove {removing?.name}?</DialogTitle>
						<DialogDescription>
							{removing?.email} will be signed out and their account deleted,
							along with {removing?.role === "admin" ? "their admin rights and " : ""}
							all document access. Pending invites to their email are cancelled.
							You can invite them again later. This can&rsquo;t be undone.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter className="rounded-b-lg border-white/10 bg-white/5">
						<Button
							variant="outline"
							className="cursor-pointer rounded-lg"
							disabled={removePending}
							onClick={() => setRemoving(null)}
						>
							Cancel
						</Button>
						<LoadingButton
							variant="destructive"
							loading={removePending}
							loadingText="Removing…"
							onClick={removeUser}
							className="rounded-lg"
						>
							Remove user
						</LoadingButton>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
