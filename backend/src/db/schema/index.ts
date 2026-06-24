import {
    pgTable,
    uuid,
    varchar,
    text,
    timestamp,
    integer,
    boolean,
    pgEnum,
    unique,
    index,
    jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums
export const userRoleEnum = pgEnum("user_role", ["user", "admin", "moderator"]);
export const userStatusEnum = pgEnum("user_status", ["active", "suspended", "banned"]);

export const mangaStatusEnum = pgEnum("manga_status", [
    "ongoing",
    "completed",
    "hiatus",
    "cancelled",
]);

export const mangaTypeEnum = pgEnum("manga_type", [
    "manga",
    "manhwa",
    "manhua",
    "webtoon",
]);

// ============ USERS ============
export const users = pgTable("users", {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", { length: 255 }).unique().notNull(),
    username: varchar("username", { length: 50 }).unique().notNull(),
    passwordHash: text("password_hash").notNull(),
    avatarUrl: text("avatar_url"),
    role: userRoleEnum("role").default("user").notNull(),
    status: userStatusEnum("status").default("active").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============ MANGA ============
export const manga = pgTable("manga", {
    id: uuid("id").primaryKey().defaultRandom(),
    title: varchar("title", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).unique().notNull(),
    description: text("description"),
    coverUrl: text("cover_url"),
    bannerUrl: text("banner_url"),
    author: varchar("author", { length: 255 }),
    artist: varchar("artist", { length: 255 }),
    status: mangaStatusEnum("status").default("ongoing").notNull(),
    type: mangaTypeEnum("type").default("manga").notNull(),
    releaseYear: integer("release_year"),
    isNsfw: boolean("is_nsfw").default(false).notNull(),
    isPublished: boolean("is_published").default(true).notNull(),
    viewCount: integer("view_count").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============ GENRES ============
export const genres = pgTable("genres", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 50 }).unique().notNull(),
    slug: varchar("slug", { length: 50 }).unique().notNull(),
});

export const mangaToGenres = pgTable("manga_to_genres", {
    mangaId: uuid("manga_id")
        .references(() => manga.id, { onDelete: "cascade" })
        .notNull(),
    genreId: uuid("genre_id")
        .references(() => genres.id, { onDelete: "cascade" })
        .notNull(),
});

// ============ CHAPTERS ============
export const chapters = pgTable("chapters", {
    id: uuid("id").primaryKey().defaultRandom(),
    mangaId: uuid("manga_id")
        .references(() => manga.id, { onDelete: "cascade" })
        .notNull(),
    number: integer("number").notNull(),
    title: varchar("title", { length: 255 }),
    slug: varchar("slug", { length: 255 }).notNull(),
    pageCount: integer("page_count").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============ PAGES ============
export const pages = pgTable("pages", {
    id: uuid("id").primaryKey().defaultRandom(),
    chapterId: uuid("chapter_id")
        .references(() => chapters.id, { onDelete: "cascade" })
        .notNull(),
    pageNumber: integer("page_number").notNull(),
    imageUrl: text("image_url").notNull(),
    width: integer("width"),
    height: integer("height"),
});

// ============ READING PROGRESS ============
export const readingProgress = pgTable(
    "reading_progress",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        userId: uuid("user_id")
            .references(() => users.id, { onDelete: "cascade" })
            .notNull(),
        mangaId: uuid("manga_id")
            .references(() => manga.id, { onDelete: "cascade" })
            .notNull(),
        chapterId: uuid("chapter_id")
            .references(() => chapters.id, { onDelete: "cascade" })
            .notNull(),
        pageNumber: integer("page_number").default(1).notNull(),
        updatedAt: timestamp("updated_at").defaultNow().notNull(),
    },
    (t) => [unique().on(t.userId, t.mangaId)],
);

// ============ FAVORITES ============
export const favorites = pgTable("favorites", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
        .references(() => users.id, { onDelete: "cascade" })
        .notNull(),
    mangaId: uuid("manga_id")
        .references(() => manga.id, { onDelete: "cascade" })
        .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============ RELATIONS ============
export const mangaRelations = relations(manga, ({ many }) => ({
    chapters: many(chapters),
    genres: many(mangaToGenres),
    favorites: many(favorites),
}));

export const chaptersRelations = relations(chapters, ({ one, many }) => ({
    manga: one(manga, {
        fields: [chapters.mangaId],
        references: [manga.id],
    }),
    pages: many(pages),
}));

export const pagesRelations = relations(pages, ({ one }) => ({
    chapter: one(chapters, {
        fields: [pages.chapterId],
        references: [chapters.id],
    }),
}));

export const usersRelations = relations(users, ({ many }) => ({
    readingProgress: many(readingProgress),
    favorites: many(favorites),
}));

export const readingProgressRelations = relations(
    readingProgress,
    ({ one }) => ({
        chapter: one(chapters, {
            fields: [readingProgress.chapterId],
            references: [chapters.id],
        }),
        manga: one(manga, {
            fields: [readingProgress.mangaId],
            references: [manga.id],
        }),
    }),
);

// ============ TRENDING ENGINE ============
export const mangaViews = pgTable(
    "manga_views",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        mangaId: uuid("manga_id")
            .references(() => manga.id, { onDelete: "cascade" })
            .notNull(),
        ipAddress: varchar("ip_address", { length: 45 }),
        userId: uuid("user_id").references(() => users.id, {
            onDelete: "set null",
        }),
        createdAt: timestamp("created_at").defaultNow().notNull(),
    },
    (t) => [index("idx_manga_views_manga_created").on(t.mangaId, t.createdAt)],
);

export const mangaRatings = pgTable(
    "manga_ratings",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        mangaId: uuid("manga_id")
            .references(() => manga.id, { onDelete: "cascade" })
            .notNull(),
        userId: uuid("user_id")
            .references(() => users.id, { onDelete: "cascade" })
            .notNull(),
        rating: integer("rating").notNull(), // 1-5
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at").defaultNow().notNull(),
    },
    (t) => [
        unique().on(t.mangaId, t.userId),
        index("idx_manga_ratings_manga_created").on(t.mangaId, t.createdAt),
    ],
);

export const mangaComments = pgTable(
    "manga_comments",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        mangaId: uuid("manga_id")
            .references(() => manga.id, { onDelete: "cascade" })
            .notNull(),
        userId: uuid("user_id")
            .references(() => users.id, { onDelete: "cascade" })
            .notNull(),
        content: text("content").notNull(),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at").defaultNow().notNull(),
    },
    (t) => [
        index("idx_manga_comments_manga_created").on(t.mangaId, t.createdAt),
    ],
);

export const mangaBookmarks = pgTable(
    "manga_bookmarks",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        mangaId: uuid("manga_id")
            .references(() => manga.id, { onDelete: "cascade" })
            .notNull(),
        userId: uuid("user_id")
            .references(() => users.id, { onDelete: "cascade" })
            .notNull(),
        createdAt: timestamp("created_at").defaultNow().notNull(),
    },
    (t) => [
        unique().on(t.mangaId, t.userId),
        index("idx_manga_bookmarks_manga_created").on(t.mangaId, t.createdAt),
    ],
);

// ============ ADMIN ============
export const activityLogs = pgTable("activity_logs", {
    id: uuid("id").primaryKey().defaultRandom(),
    actorId: uuid("actor_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    actorName: varchar("actor_name", { length: 255 }).notNull(),
    action: varchar("action", { length: 100 }).notNull(),
    summary: text("summary").notNull(),
    targetType: varchar("target_type", { length: 50 }),
    targetId: varchar("target_id", { length: 255 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const siteSettings = pgTable("site_settings", {
    id: varchar("id", { length: 50 }).primaryKey().default("default"),
    siteName: varchar("site_name", { length: 255 }).default("MangaDen").notNull(),
    siteDescription: text("site_description").default("Read manga online").notNull(),
    maintenanceMode: boolean("maintenance_mode").default(false).notNull(),
    maintenanceMessage: text("maintenance_message").default("We are undergoing maintenance.").notNull(),
    allowRegistration: boolean("allow_registration").default(true).notNull(),
    requireEmailVerification: boolean("require_email_verification").default(false).notNull(),
    showNsfwToGuests: boolean("show_nsfw_to_guests").default(false).notNull(),
    defaultReadingMode: varchar("default_reading_mode", { length: 20 }).default("scroll").notNull(),
    featuredMangaSlug: varchar("featured_manga_slug", { length: 255 }),
    features: jsonb("features").default({
        comments: true,
        ratings: true,
        bookmarks: true,
        readingProgress: true,
    }).notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

