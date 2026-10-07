ALTER TYPE "public"."activity_action" ADD VALUE 'client.member_add';--> statement-breakpoint
ALTER TYPE "public"."activity_action" ADD VALUE 'client.member_remove';--> statement-breakpoint
CREATE TABLE "client_member" (
	"user_id" text NOT NULL,
	"client_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "client_member_user_id_client_id_pk" PRIMARY KEY("user_id","client_id")
);
--> statement-breakpoint
ALTER TABLE "document" ADD COLUMN "uploaded_by_client" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user_invite" ADD COLUMN "client_id" uuid;--> statement-breakpoint
ALTER TABLE "client_member" ADD CONSTRAINT "client_member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_member" ADD CONSTRAINT "client_member_client_id_client_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."client"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "client_member_client_id_idx" ON "client_member" USING btree ("client_id");--> statement-breakpoint
ALTER TABLE "user_invite" ADD CONSTRAINT "user_invite_client_id_client_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."client"("id") ON DELETE set null ON UPDATE no action;