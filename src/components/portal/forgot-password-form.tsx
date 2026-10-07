"use client";

import { useState } from "react";
import Link from "next/link";
import { MailCheck } from "lucide-react";

import { FormField } from "@/components/form/form-field";
import { LoadingButton } from "@/components/form/loading-button";
import { authClient } from "@/lib/auth-client";

export function ForgotPasswordForm({ defaultEmail }: { defaultEmail?: string }) {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [sentTo, setSentTo] = useState<string | null>(null);

	async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const email = String(new FormData(event.currentTarget).get("email")).trim();
		setError(null);
		setLoading(true);

		const { error } = await authClient.requestPasswordReset({
			email,
			redirectTo: "/portal/reset-password",
		});
		setLoading(false);

		if (error) {
			setError(
				error.status === 429
					? "Too many attempts. Please wait a minute and try again."
					: "Couldn't send the reset link. Please try again.",
			);
			return;
		}
		setSentTo(email);
	}

	// The same message whether or not the email has an account, so the form
	// can't be used to find out who has one.
	if (sentTo) {
		return (
			<div className="flex flex-col gap-4">
				<MailCheck className="size-8 text-brand-accent" aria-hidden />
				<p className="text-sm text-white/70">
					If an account exists for{" "}
					<strong className="text-white">{sentTo}</strong>, we&rsquo;ve sent a
					link to reset your password. It expires in 1 hour.
				</p>
				<p className="text-sm text-white/50">
					Didn&rsquo;t get it? Check your spam folder, or{" "}
					<button
						type="button"
						onClick={() => setSentTo(null)}
						className="cursor-pointer text-brand-accent hover:underline"
					>
						try again
					</button>
					.
				</p>
				<Link
					href="/portal/sign-in"
					className="text-sm text-brand-accent hover:underline"
				>
					Back to sign in
				</Link>
			</div>
		);
	}

	return (
		<form onSubmit={onSubmit} className="flex flex-col gap-5">
			<FormField
				id="email"
				label="Email"
				type="email"
				autoComplete="email"
				required
				defaultValue={defaultEmail}
			/>
			{error ? (
				<p role="alert" className="text-sm text-destructive">
					{error}
				</p>
			) : null}
			<LoadingButton
				type="submit"
				loading={loading}
				loadingText="Sending…"
				className="h-11.5 rounded-lg bg-brand-accent text-white hover:bg-brand-accent/90"
			>
				Send reset link
			</LoadingButton>
			<Link
				href="/portal/sign-in"
				className="text-center text-sm text-white/60 hover:text-white"
			>
				Back to sign in
			</Link>
		</form>
	);
}
