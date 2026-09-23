import { notFound } from "next/navigation";

import { ClientManager } from "@/components/portal/client-manager";
import { PageHeader } from "@/components/portal/ui";
import { listClients } from "@/lib/dms/clients";
import { can, isStaff } from "@/lib/dms/permissions";
import { requireActor } from "@/lib/dms/session";

export default async function ClientsPage() {
	const actor = await requireActor();
	if (!isStaff(actor)) notFound();

	const clients = await listClients(actor);

	return (
		<>
			<PageHeader
				title="Clients"
				description="The companies you build for. Every document belongs to one client."
			/>
			<ClientManager
				clients={clients}
				canManage={can(actor, "canManageClients")}
			/>
		</>
	);
}
