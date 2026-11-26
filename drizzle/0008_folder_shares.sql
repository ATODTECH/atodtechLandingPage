CREATE TABLE "folder_share" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"folder_id" uuid NOT NULL,
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
	CONSTRAINT "folder_share_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
ALTER TABLE "folder_share" ADD CONSTRAINT "folder_share_folder_id_folder_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."folder"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "folder_share" ADD CONSTRAINT "folder_share_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "folder_share" ADD CONSTRAINT "folder_share_invited_by_user_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "folder_share_folder_email_idx" ON "folder_share" USING btree ("folder_id","email");--> statement-breakpoint
CREATE INDEX "folder_share_user_id_idx" ON "folder_share" USING btree ("user_id");