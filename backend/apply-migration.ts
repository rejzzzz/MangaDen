import "dotenv/config";
import { db } from "./src/db/index.js";
import { sql } from "drizzle-orm";

async function runMigration() {
    console.log("Applying manual database migration...");
    try {
        await db.execute(sql`CREATE TYPE "public"."user_status" AS ENUM('active', 'suspended', 'banned');`);
        console.log("Created ENUM user_status");
    } catch(e: any) { console.log(e.message) }

    try {
        await db.execute(sql`
        CREATE TABLE "activity_logs" (
            "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
            "actor_id" uuid NOT NULL,
            "actor_name" varchar(255) NOT NULL,
            "action" varchar(100) NOT NULL,
            "summary" text NOT NULL,
            "target_type" varchar(50),
            "target_id" varchar(255),
            "created_at" timestamp DEFAULT now() NOT NULL
        );`);
        console.log("Created TABLE activity_logs");
    } catch(e: any) { console.log(e.message) }

    try {
        await db.execute(sql`
        CREATE TABLE "site_settings" (
            "id" varchar(50) PRIMARY KEY DEFAULT 'default' NOT NULL,
            "site_name" varchar(255) DEFAULT 'MangaDen' NOT NULL,
            "site_description" text DEFAULT 'Read manga online' NOT NULL,
            "maintenance_mode" boolean DEFAULT false NOT NULL,
            "maintenance_message" text DEFAULT 'We are undergoing maintenance.' NOT NULL,
            "allow_registration" boolean DEFAULT true NOT NULL,
            "require_email_verification" boolean DEFAULT false NOT NULL,
            "show_nsfw_to_guests" boolean DEFAULT false NOT NULL,
            "default_reading_mode" varchar(20) DEFAULT 'scroll' NOT NULL,
            "featured_manga_slug" varchar(255),
            "features" jsonb DEFAULT '{"comments":true,"ratings":true,"bookmarks":true,"readingProgress":true}'::jsonb NOT NULL,
            "updated_at" timestamp DEFAULT now() NOT NULL
        );`);
        console.log("Created TABLE site_settings");
    } catch(e: any) { console.log(e.message) }

    try {
        await db.execute(sql`ALTER TABLE "users" ADD COLUMN "status" "user_status" DEFAULT 'active' NOT NULL;`);
        console.log("Added COLUMN status to users");
    } catch(e: any) { console.log(e.message) }

    try {
        await db.execute(sql`ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;`);
        console.log("Added foreign key constraint");
    } catch(e: any) { console.log(e.message) }

    console.log("Done!");
    process.exit(0);
}

runMigration();
