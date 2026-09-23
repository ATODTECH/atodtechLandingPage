import { relations } from "drizzle-orm";
import {
	bigint,
	boolean,
	index,
	jsonb,
	pgEnum,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth";

export const documentVisibility = pgEnum("document_visibility", [
	"private",
	"public",
]);
// "pending" until the browser finishes uploading to Spaces and confirms.
export const documentStatus = pgEnum("document_status", ["pending", "ready"]);
export const shareAccess = pgEnum("share_access", ["view", "download"]);
export const shareStatus = pgEnum("share_status", [
	"pending",
	"accepted",
	"revoked",
]);
export const activityAction = pgEnum("activity_action", [
	"document.upload",
	"document.view",
	"document.download",
	"document.rename",
	"document.delete",
	"document.visibility_change",
	"share.invite",
	"share.accept",
	"share.revoke",
	"client.create",
	"client.update",
	"client.delete",
	"admin.add",
	"admin.update_permissions",
	"admin.remove",
	"user.invite",
	"user.invite_revoke",
	"user.join",
]);
export const inviteRole = pgEnum("invite_role", ["admin", "client"]);

/** Rights an admin can be given. Stored as columns on admin_permission. */
export type AdminRights = {
	canUpload: boolean;
	canDelete: boolean;
	canShare: boolean;
	canManageClients: boolean;
	canManageAdmins: boolean;
	canViewActivity: boolean;
};

/** The companies Atod builds software for. Documents are grouped by client. */
export const client = pgTable("client", {
	id: uuid("id").primaryKey().defaultRandom(),
	name: text("name").notNull(),
	createdBy: text("created_by").references(() => user.id, {
		onDelete: "set null",
	}),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at")
		.defaultNow()
		.$onUpdate(() => new Date())
		.notNull(),
});

export const document = pgTable(
	"document",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		clientId: uuid("client_id")
			.notNull()
			.references(() => client.id, { onDelete: "restrict" }),
		name: text("name").notNull(),
		storageKey: text("storage_key").notNull().unique(),
		mimeType: text("mime_type").notNull(),
		sizeBytes: bigint("size_bytes", { mode: "number" }).notNull(),
		visibility: documentVisibility("visibility").default("private").notNull(),
		status: documentStatus("status").default("pending").notNull(),
		uploadedBy: text("uploaded_by").references(() => user.id, {
			onDelete: "set null",
		}),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
		// Soft delete: the Spaces object is removed later by a cleanup job.
		deletedAt: timestamp("deleted_at"),
	},
	(table) => [
		index("document_client_id_idx").on(table.clientId),
		index("document_visibility_idx").on(table.visibility),
	],
);

export const documentShare = pgTable(
	"document_share",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		documentId: uuid("document_id")
			.notNull()
			.references(() => document.id, { onDelete: "cascade" }),
		// The invite goes to an email; userId is filled in once it's accepted.
		email: text("email").notNull(),
		userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
		access: shareAccess("access").default("view").notNull(),
		status: shareStatus("status").default("pending").notNull(),
		// SHA-256 of the invite token. The raw token only ever exists in the email.
		tokenHash: text("token_hash").notNull().unique(),
		invitedBy: text("invited_by").references(() => user.id, {
			onDelete: "set null",
		}),
		expiresAt: timestamp("expires_at").notNull(),
		acceptedAt: timestamp("accepted_at"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		uniqueIndex("document_share_document_email_idx").on(
			table.documentId,
			table.email,
		),
		index("document_share_user_id_idx").on(table.userId),
	],
);

/** Per-admin rights, set by the owner. The owner always has every right. */
export const adminPermission = pgTable("admin_permission", {
	userId: text("user_id")
		.primaryKey()
		.references(() => user.id, { onDelete: "cascade" }),
	canUpload: boolean("can_upload").default(false).notNull(),
	canDelete: boolean("can_delete").default(false).notNull(),
	canShare: boolean("can_share").default(false).notNull(),
	canManageClients: boolean("can_manage_clients").default(false).notNull(),
	canManageAdmins: boolean("can_manage_admins").default(false).notNull(),
	canViewActivity: boolean("can_view_activity").default(false).notNull(),
	updatedBy: text("updated_by").references(() => user.id, {
		onDelete: "set null",
	}),
	updatedAt: timestamp("updated_at")
		.defaultNow()
		.$onUpdate(() => new Date())
		.notNull(),
});

/**
 * Account invites. Sign-up is invite-only: an account can only be created by
 * accepting one of these, or a document share sent to a new email.
 */
export const userInvite = pgTable(
	"user_invite",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		email: text("email").notNull(),
		role: inviteRole("role").default("client").notNull(),
		// Rights granted on acceptance when role is "admin".
		adminRights: jsonb("admin_rights").$type<AdminRights>(),
		status: shareStatus("status").default("pending").notNull(),
		tokenHash: text("token_hash").notNull().unique(),
		invitedBy: text("invited_by").references(() => user.id, {
			onDelete: "set null",
		}),
		expiresAt: timestamp("expires_at").notNull(),
		acceptedAt: timestamp("accepted_at"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [index("user_invite_email_idx").on(table.email)],
);

/** Append-only audit trail. Rows are never updated or deleted by the app. */
export const activityLog = pgTable(
	"activity_log",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		actorId: text("actor_id").references(() => user.id, {
			onDelete: "set null",
		}),
		action: activityAction("action").notNull(),
		documentId: uuid("document_id").references(() => document.id, {
			onDelete: "set null",
		}),
		clientId: uuid("client_id").references(() => client.id, {
			onDelete: "set null",
		}),
		targetUserId: text("target_user_id").references(() => user.id, {
			onDelete: "set null",
		}),
		// Snapshot of names etc. so entries stay readable after deletes.
		metadata: jsonb("metadata").$type<Record<string, unknown>>(),
		ipAddress: text("ip_address"),
		userAgent: text("user_agent"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [
		index("activity_log_created_at_idx").on(table.createdAt),
		index("activity_log_document_id_idx").on(table.documentId),
		index("activity_log_actor_id_idx").on(table.actorId),
	],
);

export const clientRelations = relations(client, ({ many }) => ({
	documents: many(document),
}));

export const documentRelations = relations(document, ({ one, many }) => ({
	client: one(client, { fields: [document.clientId], references: [client.id] }),
	uploader: one(user, { fields: [document.uploadedBy], references: [user.id] }),
	shares: many(documentShare),
}));

export const documentShareRelations = relations(documentShare, ({ one }) => ({
	document: one(document, {
		fields: [documentShare.documentId],
		references: [document.id],
	}),
	user: one(user, { fields: [documentShare.userId], references: [user.id] }),
}));

export const adminPermissionRelations = relations(
	adminPermission,
	({ one }) => ({
		user: one(user, {
			fields: [adminPermission.userId],
			references: [user.id],
		}),
	}),
);

export const activityLogRelations = relations(activityLog, ({ one }) => ({
	actor: one(user, { fields: [activityLog.actorId], references: [user.id] }),
	document: one(document, {
		fields: [activityLog.documentId],
		references: [document.id],
	}),
}));
