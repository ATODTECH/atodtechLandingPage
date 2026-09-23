"use client";

import { useState } from "react";

import { acceptInviteAction } from "@/app/portal/actions";
import { LoadingButton } from "@/components/form/loading-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Accepts an invite. With `createAccount`, also asks for a name and password
 * and creates the account (the email is fixed by the invite).
 */
export function AcceptInviteForm({
	token,
	email,
	createAccount,
	cta,
}: {
	token: string;
	email: string;
	createAccount: boolean;
	cta: string;
}) {
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const form = new FormData(event.currentTarget);
		setError(null);

		if (createAccount && form.get("password") !== form.get("confirm")) {
			setError("Passwords don't match.");
			return;
		}

		setLoading(true);
		// On success the action redirects, so this only returns on failure.
		const result = await acceptInviteAction(
			token,
			createAccount
				? {
						name: String(form.get("name")).trim(),
						password: String(form.get("password")),
					}
				: undefined,
		);
		if (result && !result.ok) {
			setError(result.error);
			setLoading(false);
		}
	}

	return (
		<form onSubmit={onSubmit} className="flex flex-col gap-5">
			{createAccount ? (
				<>
					<div className="flex flex-col gap-2">
						<Label htmlFor="invite-email">Email</Label>
						<Input
							id="invite-email"
							value={email}
							readOnly
							disabled
							className="h-10"
						/>
					</div>
					<div className="flex flex-col gap-2">
						<Label htmlFor="name">Your name</Label>
						<Input
							id="name"
							name="name"
							autoComplete="name"
							required
							className="h-10"
						/>
					</div>
					<div className="flex flex-col gap-2">
						<Label htmlFor="password">Password</Label>
						<Input
							id="password"
							name="password"
							type="password"
							autoComplete="new-password"
							minLength={8}
							required
							className="h-10"
						/>
						<p className="text-xs text-white/40">At least 8 characters.</p>
					</div>
					<div className="flex flex-col gap-2">
						<Label htmlFor="confirm">Confirm password</Label>
						<Input
							id="confirm"
							name="confirm"
							type="password"
							autoComplete="new-password"
							required
							className="h-10"
						/>
					</div>
				</>
			) : null}
			{error ? (
				<p role="alert" className="text-sm text-destructive">
					{error}
				</p>
			) : null}
			<LoadingButton
				type="submit"
				loading={loading}
				className="h-10 rounded-full bg-brand-accent text-white hover:bg-brand-accent/90"
			>
				{cta}
			</LoadingButton>
		</form>
	);
}
