"use client";

import { useState } from "react";

import { acceptInviteAction } from "@/app/portal/actions";
import { FormField } from "@/components/form/form-field";
import { LoadingButton } from "@/components/form/loading-button";

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
					<FormField
						id="invite-email"
						label="Email"
						value={email}
						readOnly
						disabled
					/>
					<FormField id="name" label="Your name" autoComplete="name" required />
					<FormField
						id="password"
						label="Password"
						type="password"
						autoComplete="new-password"
						minLength={8}
						required
						hint="At least 8 characters."
					/>
					<FormField
						id="confirm"
						label="Confirm password"
						type="password"
						autoComplete="new-password"
						required
					/>
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
				className="h-11.5 rounded-lg bg-brand-accent text-white hover:bg-brand-accent/90"
			>
				{cta}
			</LoadingButton>
		</form>
	);
}
