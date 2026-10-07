import { ChangePasswordForm } from "@/components/portal/change-password-form";
import { Badge, PageHeader } from "@/components/portal/ui";
import { requireActor } from "@/lib/dms/session";

const ROLE_LABELS = { owner: "Owner", admin: "Admin", client: "Client" };

export default async function AccountPage() {
	const actor = await requireActor();

	return (
		<>
			<PageHeader title="Account" description="Your details and sign-in settings." />

			<div className="grid max-w-3xl gap-6">
				<section className="rounded-lg border border-white/10 p-5">
					<h2 className="font-medium">Your details</h2>
					<dl className="mt-4 grid gap-3 text-sm sm:grid-cols-[120px_1fr]">
						<dt className="text-white/50">Name</dt>
						<dd>{actor.name}</dd>
						<dt className="text-white/50">Email</dt>
						<dd className="break-all">{actor.email}</dd>
						<dt className="text-white/50">Role</dt>
						<dd>
							<Badge tone={actor.role === "owner" ? "accent" : actor.role === "admin" ? "public" : "neutral"}>
								{ROLE_LABELS[actor.role]}
							</Badge>
						</dd>
					</dl>
				</section>

				<section className="rounded-lg border border-white/10 p-5">
					<h2 className="font-medium">Change password</h2>
					<p className="mt-1 mb-5 text-sm text-white/60">
						You&rsquo;ll stay signed in on this device.
					</p>
					<div className="max-w-md">
						<ChangePasswordForm />
					</div>
				</section>
			</div>
		</>
	);
}
