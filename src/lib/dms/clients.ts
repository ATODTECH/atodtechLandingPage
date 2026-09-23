import "server-only";
import { and, asc, count, eq, isNotNull, isNull, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { client, document } from "@/lib/db/schema";
import { logActivity } from "@/lib/dms/activity";
import { DmsError } from "@/lib/dms/errors";
import { isUuid } from "@/lib/dms/format";
import { assertCan, isStaff, type Actor } from "@/lib/dms/permissions";

/** Clients with how many live documents each has. Staff only. */
export async function listClients(actor: Actor) {
	if (!isStaff(actor)) return [];
	return db
		.select({
			id: client.id,
			name: client.name,
			createdAt: client.createdAt,
			documentCount: count(document.id),
		})
		.from(client)
		.leftJoin(
			document,
			and(
				eq(document.clientId, client.id),
				eq(document.status, "ready"),
				isNull(document.deletedAt),
			),
		)
		.groupBy(client.id)
		.orderBy(asc(client.name));
}

function cleanName(name: string) {
	const trimmed = name.trim().slice(0, 120);
	if (!trimmed) throw new DmsError("Client name can't be empty.");
	return trimmed;
}

export async function createClient(actor: Actor, name: string) {
	assertCan(actor, "canManageClients");
	const [row] = await db
		.insert(client)
		.values({ name: cleanName(name), createdBy: actor.id })
		.returning();
	await logActivity({
		actorId: actor.id,
		action: "client.create",
		clientId: row.id,
		metadata: { name: row.name },
	});
	return row;
}

export async function renameClient(actor: Actor, id: string, name: string) {
	assertCan(actor, "canManageClients");
	const existing = isUuid(id)
		? await db.query.client.findFirst({ where: eq(client.id, id) })
		: undefined;
	if (!existing) throw new DmsError("Client not found.");
	const newName = cleanName(name);

	await db.update(client).set({ name: newName }).where(eq(client.id, id));
	await logActivity({
		actorId: actor.id,
		action: "client.update",
		clientId: id,
		metadata: { from: existing.name, to: newName },
	});
}

/** Only clients with no live documents can be deleted. */
export async function deleteClient(actor: Actor, id: string) {
	assertCan(actor, "canManageClients");
	const existing = isUuid(id)
		? await db.query.client.findFirst({ where: eq(client.id, id) })
		: undefined;
	if (!existing) throw new DmsError("Client not found.");

	const [{ live }] = await db
		.select({ live: count() })
		.from(document)
		.where(
			and(
				eq(document.clientId, id),
				eq(document.status, "ready"),
				isNull(document.deletedAt),
			),
		);
	if (live > 0) {
		throw new DmsError("Delete or move this client's documents first.");
	}

	await db.transaction(async (tx) => {
		// Leftover rows: deleted documents and abandoned uploads.
		await tx
			.delete(document)
			.where(
				and(
					eq(document.clientId, id),
					or(isNotNull(document.deletedAt), eq(document.status, "pending")),
				),
			);
		await tx.delete(client).where(eq(client.id, id));
	});
	await logActivity({
		actorId: actor.id,
		action: "client.delete",
		metadata: { name: existing.name },
	});
}
