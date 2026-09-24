CREATE TYPE "public"."activity_action" AS ENUM('document.upload', 'document.view', 'document.download', 'document.rename', 'document.delete', 'document.visibility_change', 'share.invite', 'share.accept', 'share.revoke', 'client.create', 'client.update', 'client.delete', 'admin.add', 'admin.update_permissions', 'admin.remove');--> statement-breakpoint
CREATE TYPE "public"."document_status" AS ENUM('pending', 'ready');--> statement-breakpoint
CREATE TYPE "public"."document_visibility" AS ENUM('private', 'public');--> statement-breakpoint
CREATE TYPE "public"."share_access" AS ENUM('view', 'download');--> statement-breakpoint
CREATE TYPE "public"."share_status" AS ENUM('pending', 'accepted', 'revoked');--> statement-breakpoint
CREATE TABLE "activity_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" text,
	"action" "activity_action" NOT NULL,
	"document_id" uuid,
	"client_id" uuid,
	"target_user_id" text,
	"metadata" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_permission" (
	"user_id" text PRIMARY KEY NOT NULL,
	"can_upload" boolean DEFAULT false NOT NULL,
	"can_delete" boolean DEFAULT false NOT NULL,
	"can_share" boolean DEFAULT false NOT NULL,
	"can_manage_clients" boolean DEFAULT false NOT NULL,
	"can_manage_admins" boolean DEFAULT false NOT NULL,
	"can_view_activity" boolean DEFAULT false NOT NULL,
	"updated_by" text,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "client" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"name" text NOT NULL,
	"storage_key" text NOT NULL,
	"mime_type" text NOT NULL,
	"size_bytes" bigint NOT NULL,
	"visibility" "document_visibility" DEFAULT 'private' NOT NULL,
	"status" "document_status" DEFAULT 'pending' NOT NULL,
	"uploaded_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "document_storage_key_unique" UNIQUE("storage_key")
);
--> statement-breakpoint
CREATE TABLE "document_share" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"email" text NOT NULL,
	"user_id" text,
	"access" "share_access" DEFAULT 'view' NOT NULL,
	"status" "share_status" DEFAULT 'pending' NOT NULL,
	"token_hash" text NOT NULL,
	"invited_by" text,
	"expires_at" timestamp NOT NULL,
	"accepted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "document_share_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_actor_id_user_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_document_id_document_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."document"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_client_id_client_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."client"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_target_user_id_user_id_fk" FOREIGN KEY ("target_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_permission" ADD CONSTRAINT "admin_permission_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_permission" ADD CONSTRAINT "admin_permission_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client" ADD CONSTRAINT "client_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document" ADD CONSTRAINT "document_client_id_client_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."client"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document" ADD CONSTRAINT "document_uploaded_by_user_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_share" ADD CONSTRAINT "document_share_document_id_document_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."document"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_share" ADD CONSTRAINT "document_share_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_share" ADD CONSTRAINT "document_share_invited_by_user_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activity_log_created_at_idx" ON "activity_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "activity_log_document_id_idx" ON "activity_log" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "activity_log_actor_id_idx" ON "activity_log" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "document_client_id_idx" ON "document" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "document_visibility_idx" ON "document" USING btree ("visibility");--> statement-breakpoint
CREATE UNIQUE INDEX "document_share_document_email_idx" ON "document_share" USING btree ("document_id","email");--> statement-breakpoint
CREATE INDEX "document_share_user_id_idx" ON "document_share" USING btree ("user_id");