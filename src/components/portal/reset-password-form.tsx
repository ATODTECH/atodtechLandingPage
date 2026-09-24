"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { FormField } from "@/components/form/form-field";
import { LoadingButton } from "@/components/form/loading-button";
import { authClient } from "@/lib/auth-client";

export function ResetPasswordForm({ token }: { token: string }) {
	const router = useRouter();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const data = new FormData(event.currentTarget);
		const newPassword = String(data.get("newPassword"));
		setError(null);

		if (newPassword !== data.get("confirmPassword")) {
			setError("Passwords don't match.");
			return;
		}

		setLoading(true);
		const { error } = await authClient.resetPassword({ newPassword, token });
		if (error) {
			setLoading(false);
			setError(
				error.code === "INVALID_TOKEN"
					? "This reset link has expired or already been used. Request a new one."
					: (error.message ?? "Couldn't reset your password. Please try again."),
			);
			return;
		}
		router.replace("/portal/sign-in?reset=1");
	}

	return (
		<form onSubmit={onSubmit} className="flex flex-col gap-5">
			<FormField
				id="newPassword"
				label="New password"
				type="password"
				autoComplete="new-password"
				minLength={8}
				maxLength={128}
				required
				autoFocus
				hint="At least 8 characters."
			/>
			<FormField
				id="confirmPassword"
				label="Confirm new password"
				type="password"
				autoComplete="new-password"
				required
			/>
			{error ? (
				<p role="alert" className="text-sm text-destructive">
					{error}
				</p>
			) : null}
			<LoadingButton
				type="submit"
				loading={loading}
				loadingText="Saving…"
				className="h-11.5 rounded-lg bg-brand-accent text-white hover:bg-brand-accent/90"
			>
				Reset password
			</LoadingButton>
		</form>
	);
}
