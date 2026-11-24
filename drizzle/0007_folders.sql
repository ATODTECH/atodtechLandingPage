CREATE TABLE "folder" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"parent_id" uuid,
	"name" text NOT NULL,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "document" ADD COLUMN "folder_id" uuid;--> statement-breakpoint
ALTER TABLE "document" ADD COLUMN "notify_pending" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "folder" ADD CONSTRAINT "folder_client_id_client_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."client"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "folder" ADD CONSTRAINT "folder_parent_id_folder_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."folder"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "folder" ADD CONSTRAINT "folder_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "folder_parent_name_idx" ON "folder" USING btree ("parent_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "folder_client_root_name_idx" ON "folder" USING btree ("client_id","name") WHERE "folder"."parent_id" is null;--> statement-breakpoint
CREATE INDEX "folder_client_id_idx" ON "folder" USING btree ("client_id");--> statement-breakpoint
ALTER TABLE "document" ADD CONSTRAINT "document_folder_id_folder_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."folder"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "document_folder_id_idx" ON "document" USING btree ("folder_id");