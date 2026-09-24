import type { Metadata } from "next";

import { PortalNav, type NavItem } from "@/components/portal/portal-nav";
import { can, isStaff } from "@/lib/dms/permissions";
import { requireActor } from "@/lib/dms/session";

export const metadata: Metadata = {
	title: "Documents | ATOD Tech Agency",
	robots: { index: false, follow: false },
};

const ROLE_LABELS = { owner: "Owner", admin: "Admin", client: "Client" };

export default async function PortalLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const actor = await requireActor();

	const items: NavItem[] = [
		{ key: "documents", label: "Documents", href: "/portal" },
	];
	if (isStaff(actor)) {
		items.push({ key: "clients", label: "Clients", href: "/portal/clients" });
	}
	if (can(actor, "canManageAdmins")) {
		items.push({ key: "team", label: "Team", href: "/portal/team" });
	}
	if (can(actor, "canViewActivity")) {
		items.push({ key: "activity", label: "Activity", href: "/portal/activity" });
	}
	items.push({ key: "account", label: "Account", href: "/portal/account" });

	return (
		<div className="dark flex min-h-screen flex-col bg-page text-white">
			<PortalNav
				items={items}
				userName={actor.name}
				userEmail={actor.email}
				roleLabel={ROLE_LABELS[actor.role]}
			/>
			<main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
				{children}
			</main>
		</div>
	);
}
