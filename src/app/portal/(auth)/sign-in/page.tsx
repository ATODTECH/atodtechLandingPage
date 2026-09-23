import { redirect } from "next/navigation";

import { SignInForm } from "@/components/portal/sign-in-form";
import { getActor } from "@/lib/dms/session";

/** Only allow redirects back into the portal. */
function safeNext(next: string | string[] | undefined) {
	const value = Array.isArray(next) ? next[0] : next;
	return value?.startsWith("/portal") && !value.startsWith("//")
		? value
		: "/portal";
}

export default async function SignInPage({
	searchParams,
}: {
	searchParams: Promise<{ next?: string | string[]; email?: string }>;
}) {
	const params = await searchParams;
	const next = safeNext(params.next);
	if (await getActor()) redirect(next);

	return (
		<>
			<h1 className="text-xl font-semibold">Sign in</h1>
			<p className="mt-1 mb-6 text-sm text-white/60">
				Access your Atod Tech project documents.
			</p>
			<SignInForm next={next} defaultEmail={params.email} />
			<p className="mt-6 text-center text-xs text-white/40">
				Access is by invitation only. Check your email for an invite link.
			</p>
		</>
	);
}
