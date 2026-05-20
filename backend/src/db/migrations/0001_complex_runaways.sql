CREATE TABLE "manga_bookmarks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"manga_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "manga_bookmarks_manga_id_user_id_unique" UNIQUE("manga_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "manga_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"manga_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "manga_ratings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"manga_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"rating" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "manga_ratings_manga_id_user_id_unique" UNIQUE("manga_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "manga_views" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"manga_id" uuid NOT NULL,
	"ip_address" varchar(45),
	"user_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "manga_bookmarks" ADD CONSTRAINT "manga_bookmarks_manga_id_manga_id_fk" FOREIGN KEY ("manga_id") REFERENCES "public"."manga"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manga_bookmarks" ADD CONSTRAINT "manga_bookmarks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manga_comments" ADD CONSTRAINT "manga_comments_manga_id_manga_id_fk" FOREIGN KEY ("manga_id") REFERENCES "public"."manga"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manga_comments" ADD CONSTRAINT "manga_comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manga_ratings" ADD CONSTRAINT "manga_ratings_manga_id_manga_id_fk" FOREIGN KEY ("manga_id") REFERENCES "public"."manga"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manga_ratings" ADD CONSTRAINT "manga_ratings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manga_views" ADD CONSTRAINT "manga_views_manga_id_manga_id_fk" FOREIGN KEY ("manga_id") REFERENCES "public"."manga"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manga_views" ADD CONSTRAINT "manga_views_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_manga_bookmarks_manga_created" ON "manga_bookmarks" USING btree ("manga_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_manga_comments_manga_created" ON "manga_comments" USING btree ("manga_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_manga_ratings_manga_created" ON "manga_ratings" USING btree ("manga_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_manga_views_manga_created" ON "manga_views" USING btree ("manga_id","created_at");--> statement-breakpoint
ALTER TABLE "reading_progress" ADD CONSTRAINT "reading_progress_user_id_manga_id_unique" UNIQUE("user_id","manga_id");