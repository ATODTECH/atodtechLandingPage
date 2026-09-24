import { ForgotPasswordForm } from "@/components/portal/forgot-password-form";

export default async function ForgotPasswordPage({
	searchParams,
}: {
	searchParams: Promise<{ email?: string }>;
}) {
	const { email } = await searchParams;

	return (
		<>
			<h1 className="text-xl font-semibold">Forgot your password?</h1>
			<p className="mt-1 mb-6 text-sm text-white/60">
				Enter your email and we&rsquo;ll send you a link to choose a new one.
			</p>
			<ForgotPasswordForm defaultEmail={email} />
		</>
	);
}
