CREATE TYPE "public"."agent_client" AS ENUM('codex', 'claude', 'antigravity', 'other');--> statement-breakpoint
CREATE TYPE "public"."post_status" AS ENUM('pending', 'approved', 'rejected', 'published', 'failed');--> statement-breakpoint
CREATE TYPE "public"."profile_section" AS ENUM('headline', 'about', 'experience');--> statement-breakpoint
CREATE TYPE "public"."suggestion_status" AS ENUM('new', 'applied', 'dismissed');--> statement-breakpoint
CREATE TABLE "agents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"client" "agent_client" DEFAULT 'other' NOT NULL,
	"token_hash" text NOT NULL,
	"token_prefix" text NOT NULL,
	"trusted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_used_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	CONSTRAINT "agents_name_unique" UNIQUE("name"),
	CONSTRAINT "agents_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL,
	"actor" text NOT NULL,
	"action" text NOT NULL,
	"target" text,
	"detail" jsonb
);
--> statement-breakpoint
CREATE TABLE "linkedin_connection" (
	"id" text PRIMARY KEY DEFAULT 'owner' NOT NULL,
	"member_sub" text NOT NULL,
	"name" text,
	"email" text,
	"picture_url" text,
	"access_token_enc" text NOT NULL,
	"scopes" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" uuid,
	"body" text NOT NULL,
	"link_url" text,
	"status" "post_status" DEFAULT 'pending' NOT NULL,
	"linkedin_post_urn" text,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"decided_at" timestamp with time zone,
	"published_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "profile_suggestions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" uuid,
	"section" "profile_section" NOT NULL,
	"title" text,
	"body" text NOT NULL,
	"rationale" text,
	"status" "suggestion_status" DEFAULT 'new' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"decided_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_suggestions" ADD CONSTRAINT "profile_suggestions_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_log_at_idx" ON "audit_log" USING btree ("at");--> statement-breakpoint
CREATE INDEX "posts_status_idx" ON "posts" USING btree ("status");