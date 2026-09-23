"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { LoadingButton } from "@/components/form/loading-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
			<div className="flex flex-col gap-2">
				<Label htmlFor="email">Email</Label>
				<Input
					id="email"
					name="email"
					type="email"
					autoComplete="email"
					required
					defaultValue={defaultEmail}
					className="h-10"
				/>
			</div>
			<div className="flex flex-col gap-2">
				<Label htmlFor="password">Password</Label>
				<Input
					id="password"
					name="password"
					type="password"
					autoComplete="current-password"
					required
					className="h-10"
				/>
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
				className="h-10 rounded-full bg-brand-accent text-white hover:bg-brand-accent/90"
			>
				Sign in
			</LoadingButton>
		</form>
	);
}
