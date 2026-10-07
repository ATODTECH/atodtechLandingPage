import { notFound } from "next/navigation";

import { TeamManager } from "@/components/portal/team-manager";
import { PageHeader } from "@/components/portal/ui";
import { can } from "@/lib/dms/permissions";
import { requireActor } from "@/lib/dms/session";
import { listClients } from "@/lib/dms/clients";
import { listTeam } from "@/lib/dms/team";

export default async function TeamPage() {
	const actor = await requireActor();
	if (!can(actor, "canManageAdmins")) notFound();

	const [{ users, invites }, clients] = await Promise.all([
		listTeam(actor),
		listClients(actor),
	]);

	return (
		<>
			<PageHeader
				title="Team"
				description="Invite clients and admins, and choose what each admin can do."
			/>
			<TeamManager
				users={users}
				invites={invites}
				currentUserId={actor.id}
				grantable={actor.rights}
				canRemoveUsers={actor.role === "owner"}
				clients={clients.map((c) => ({ id: c.id, name: c.name }))}
			/>
		</>
	);
}
