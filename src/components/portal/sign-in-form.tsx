"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { FormField } from "@/components/form/form-field";
import { LoadingButton } from "@/components/form/loading-button";
import { signIn } from "@/lib/auth-client";

export function SignInForm({
	next,
	defaultEmail,
}: {
	next: string;
	defaultEmail?: string;
}) {
	const router = useRouter();
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const form = new FormData(event.currentTarget);
		setError(null);
		setLoading(true);

		const { error } = await signIn.email({
			email: String(form.get("email")),
			password: String(form.get("password")),
		});

		if (error) {
			setError(
				error.status === 401
					? "Incorrect email or password."
					: (error.message ?? "Couldn't sign in. Please try again."),
			);
			setLoading(false);
			return;
		}
		router.replace(next);
		router.refresh();
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
			<div className="flex flex-col gap-2">
				<FormField
					id="password"
					label="Password"
					type="password"
					autoComplete="current-password"
					required
				/>
				<Link
					href="/portal/forgot-password"
					className="self-end text-sm text-brand-accent hover:underline"
				>
					Forgot password?
				</Link>
			</div>
			{error ? (
				<p role="alert" className="text-sm text-destructive">
					{error}
				</p>
			) : null}
			<LoadingButton
				type="submit"
				loading={loading}
				loadingText="Signing in…"
				className="h-11.5 rounded-lg bg-brand-accent text-white hover:bg-brand-accent/90"
			>
				Sign in
			</LoadingButton>
		</form>
	);
}
