import Link from "next/link";

import { signOutAction } from "@/app/portal/actions";
import { AcceptInviteForm } from "@/components/portal/accept-invite-form";
import { hasAccount, resolveInvite } from "@/lib/dms/invites";
import { getActor } from "@/lib/dms/session";

export default async function InvitePage({
	params,
}: {
	params: Promise<{ token: string }>;
}) {
	const { token } = await params;
	const [invite, actor] = await Promise.all([resolveInvite(token), getActor()]);

	if (!invite) {
		return (
			<>
				<h1 className="text-xl font-semibold">Invite not valid</h1>
				<p className="mt-2 text-sm text-white/60">
					This link has expired, was cancelled, or has already been used. Ask
					whoever invited you to send a new one.
				</p>
				<Link
					href="/portal/sign-in"
					className="mt-6 inline-block text-sm text-brand-accent hover:underline"
				>
					Go to sign in
				</Link>
			</>
		);
	}

	const heading =
		invite.kind === "share"
			? `"${invite.documentName}" was shared with you`
			: invite.role === "admin"
				? "You've been invited as an admin"
				: "You've been invited to Atod Tech documents";
	const cta = invite.kind === "share" ? "Open document" : "Accept invite";

	// Signed in as someone else.
	if (actor && actor.email.toLowerCase() !== invite.email) {
		return (
			<>
				<h1 className="text-xl font-semibold">{heading}</h1>
				<p className="mt-2 text-sm text-white/60">
					This invite is for <strong className="text-white">{invite.email}</strong>,
					but you&apos;re signed in as {actor.email}.
				</p>
				<form action={signOutAction} className="mt-6">
					<button
						type="submit"
						className="cursor-pointer text-sm text-brand-accent hover:underline"
					>
						Sign out and switch account
					</button>
				</form>
			</>
		);
	}

	// Signed in as the invited person: one click to accept.
	if (actor) {
		return (
			<>
				<h1 className="text-xl font-semibold">{heading}</h1>
				<p className="mt-2 mb-6 text-sm text-white/60">
					Signed in as {actor.email}.
				</p>
				<AcceptInviteForm
					token={token}
					email={invite.email}
					createAccount={false}
					cta={cta}
				/>
			</>
		);
	}

	// Has an account but isn't signed in.
	if (await hasAccount(invite.email)) {
		const signInHref = `/portal/sign-in?${new URLSearchParams({
			next: `/portal/invite/${token}`,
			email: invite.email,
		})}`;
		return (
			<>
				<h1 className="text-xl font-semibold">{heading}</h1>
				<p className="mt-2 mb-6 text-sm text-white/60">
					Sign in as <strong className="text-white">{invite.email}</strong> to
					accept.
				</p>
				<Link
					href={signInHref}
					className="flex h-11.5 items-center justify-center rounded-lg bg-brand-accent text-sm font-medium text-white hover:bg-brand-accent/90"
				>
					Sign in to continue
				</Link>
			</>
		);
	}

	// New user: create an account.
	return (
		<>
			<h1 className="text-xl font-semibold">{heading}</h1>
			<p className="mt-2 mb-6 text-sm text-white/60">
				Create your account to continue.
			</p>
			<AcceptInviteForm
				token={token}
				email={invite.email}
				createAccount
				cta={`Create account & ${cta.toLowerCase()}`}
			/>
		</>
	);
}
