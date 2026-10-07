CREATE TYPE "public"."invite_role" AS ENUM('admin', 'client');--> statement-breakpoint
ALTER TYPE "public"."activity_action" ADD VALUE 'user.invite';--> statement-breakpoint
ALTER TYPE "public"."activity_action" ADD VALUE 'user.invite_revoke';--> statement-breakpoint
ALTER TYPE "public"."activity_action" ADD VALUE 'user.join';--> statement-breakpoint
CREATE TABLE "user_invite" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"role" "invite_role" DEFAULT 'client' NOT NULL,
	"admin_rights" jsonb,
	"status" "share_status" DEFAULT 'pending' NOT NULL,
	"token_hash" text NOT NULL,
	"invited_by" text,
	"expires_at" timestamp NOT NULL,
	"accepted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_invite_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
ALTER TABLE "user_invite" ADD CONSTRAINT "user_invite_invited_by_user_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "user_invite_email_idx" ON "user_invite" USING btree ("email");