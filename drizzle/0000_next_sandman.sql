CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"duration_sec" integer NOT NULL,
	"mode" text NOT NULL,
	"goal_sec" integer,
	"tension" text,
	"note" text,
	"updated_at" timestamp with time zone NOT NULL,
	"deleted_at" timestamp with time zone,
	"synced_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "sessions_user_synced" ON "sessions" USING btree ("user_id","synced_at");