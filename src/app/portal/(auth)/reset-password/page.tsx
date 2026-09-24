import Link from "next/link";

import { ResetPasswordForm } from "@/components/portal/reset-password-form";

/**
 * The emailed link goes to Better Auth, which checks the token and redirects
 * here with ?token=… if it's valid, or ?error=INVALID_TOKEN if not.
 */
export default async function ResetPasswordPage({
	searchParams,
}: {
	searchParams: Promise<{ token?: string; error?: string }>;
}) {
	const { token, error } = await searchParams;

	if (error || !token) {
		return (
			<>
				<h1 className="text-xl font-semibold">Link expired</h1>
				<p className="mt-2 text-sm text-white/60">
					This password reset link has expired or already been used. Links
					work once and last 1 hour.
				</p>
				<Link
					href="/portal/forgot-password"
					className="mt-6 flex h-11.5 items-center justify-center rounded-lg bg-brand-accent text-sm font-medium text-white hover:bg-brand-accent/90"
				>
					Send a new link
				</Link>
			</>
		);
	}

	return (
		<>
			<h1 className="text-xl font-semibold">Choose a new password</h1>
			<p className="mt-1 mb-6 text-sm text-white/60">
				You&rsquo;ll be signed out on all devices and can then sign in with
				your new password.
			</p>
			<ResetPasswordForm token={token} />
		</>
	);
}
