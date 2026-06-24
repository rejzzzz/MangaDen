import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "../db/index.js";
import { manga } from "../db/schema/index.js";
import { eq, desc, ilike, and, sql } from "drizzle-orm";
import { cache, redis } from "../lib/cache/redis.js";
import {
    authMiddleware,
    adminMiddleware,
} from "../middleware/auth.middleware.js";

export const mangaRoutes = new Hono();

// Validation schemas
const createMangaSchema = z.object({
    title: z.string().min(1).max(255),
    slug: z.string().min(1).max(255),
    description: z.string().optional(),
    coverUrl: z.string().url().optional(),
    author: z.string().optional(),
    artist: z.string().optional(),
    status: z.enum(["ongoing", "completed", "hiatus", "cancelled"]).optional(),
    type: z.enum(["manga", "manhwa", "manhua", "webtoon"]).optional(),
    releaseYear: z.number().int().optional(),
    isNsfw: z.boolean().optional(),
    isPublished: z.boolean().optional(),
});

const querySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(50).default(20),
    search: z.string().optional(),
    status: z.enum(["ongoing", "completed", "hiatus", "cancelled"]).optional(),
    type: z.enum(["manga", "manhwa", "manhua", "webtoon"]).optional(),
});

// GET /api/manga - List all manga
mangaRoutes.get("/", zValidator("query", querySchema), async (c) => {
    const { page, limit, search, status, type } = c.req.valid("query");
    const offset = (page - 1) * limit;

    // Skip cache if searching (for real-time results)
    if (!search) {
        const cacheKey = `manga:list:${page}:${limit}:${status || ""}:${type || ""}`;
        const cached = await cache.get(cacheKey);
        if (cached) {
            return c.json({ success: true, data: cached, cached: true });
        }
    }

    // Build dynamic query with filters
    const conditions = [eq(manga.isPublished, true)];

    if (search) {
        conditions.push(ilike(manga.title, `%${search}%`));
    }
    if (status) {
        conditions.push(eq(manga.status, status));
    }
    if (type) {
        conditions.push(eq(manga.type, type));
    }

    const results = await db
        .select()
        .from(manga)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(manga.updatedAt))
        .limit(limit)
        .offset(offset);

    // Cache only non-search results
    if (!search) {
        const cacheKey = `manga:list:${page}:${limit}:${status || ""}:${type || ""}`;
        await cache.set(cacheKey, results, 300);
    }

    return c.json({
        success: true,
        data: results,
        pagination: { page, limit },
    });
});

// GET /api/manga/:slug - Get single manga
mangaRoutes.get("/:slug", async (c) => {
    const slug = c.req.param("slug");

    // Try cache
    const cacheKey = `manga:${slug}`;
    const cached = await cache.get(cacheKey);
    if (cached) {
        return c.json({ success: true, data: cached, cached: true });
    }

    const result = await db.query.manga.findFirst({
        where: eq(manga.slug, slug),
        with: {
            chapters: {
                orderBy: (chapters, { asc }) => [asc(chapters.number)],
            },
        },
    });

    if (!result) {
        return c.json({ success: false, error: "Manga not found" }, 404);
    }

    await cache.set(cacheKey, result, 600);

    return c.json({ success: true, data: result });
});

// POST /api/manga/:slug/view - Increment view count (debounced per IP)
mangaRoutes.post("/:slug/view", async (c) => {
    const slug = c.req.param("slug");
    const ip =
        c.req.header("x-forwarded-for") ??
        c.req.header("x-real-ip") ??
        "unknown";
    const dedupeKey = `view:${slug}:${ip}`;

    // Only count once per IP per hour
    const already = await redis.get(dedupeKey);
    if (already) return c.json({ success: true, counted: false });

    await redis.set(dedupeKey, 1, { ex: 3600 });

    // Increment in DB
    await db
        .update(manga)
        .set({ viewCount: sql`${manga.viewCount} + 1` })
        .where(eq(manga.slug, slug));

    // Invalidate cached manga so view count stays fresh
    await cache.del(`manga:${slug}`);

    return c.json({ success: true, counted: true });
});

import { uploadImage } from "../lib/storage/cloudinary.js";

// POST /api/manga/upload-cover - Upload cover image (admin only)
mangaRoutes.post(
    "/upload-cover",
    authMiddleware,
    adminMiddleware,
    async (c) => {
        const body = await c.req.parseBody();
        const file = body["file"];

        if (!file || !(file instanceof File)) {
            return c.json({ success: false, error: "No image file uploaded" }, 400);
        }

        if (!file.type.startsWith("image/")) {
            return c.json({ success: false, error: "File must be an image" }, 400);
        }

        if (file.size > 5 * 1024 * 1024) {
            return c.json({ success: false, error: "Image size exceeds 5MB limit" }, 413);
        }

        try {
            const arrayBuffer = await file.arrayBuffer();
            const { secure_url } = await uploadImage(Buffer.from(arrayBuffer), "covers");
            return c.json({ success: true, data: { url: secure_url } }, 201);
        } catch (error: any) {
            console.error("Cover upload failed:", error);
            return c.json({ success: false, error: error.message || "Upload failed" }, 500);
        }
    }
);

// POST /api/manga - Create manga (admin only)
mangaRoutes.post(
    "/",
    authMiddleware,
    adminMiddleware,
    zValidator("json", createMangaSchema),
    async (c) => {
        const body = c.req.valid("json");

        const [result] = await db
            .insert(manga)
            .values({
                title: body.title!,
                slug: body.slug!,
                description: body.description,
                coverUrl: body.coverUrl,
                author: body.author,
                artist: body.artist,
                status: body.status,
                type: body.type,
                releaseYear: body.releaseYear,
                isNsfw: body.isNsfw ?? false, // Default to false if undefined
                isPublished: body.isPublished ?? true, // Default to true if undefined
                viewCount: 0,
            })
            .returning();

        // Invalidate list cache
        await cache.delPattern("manga:list:*");

        return c.json({ success: true, data: result }, 201);
    },
);

// PATCH /api/manga/:id - Update manga (admin only)
mangaRoutes.patch(
    "/:id",
    authMiddleware,
    adminMiddleware,
    zValidator("json", createMangaSchema.partial()),
    async (c) => {
        const id = c.req.param("id");
        const body = c.req.valid("json");

        const [result] = await db
            .update(manga)
            .set({ ...body, updatedAt: new Date() })
            .where(eq(manga.id, id))
            .returning();

        if (!result) {
            return c.json({ success: false, error: "Manga not found" }, 404);
        }

        // Invalidate caches
        await cache.del(`manga:${result.slug}`);
        await cache.delPattern("manga:list:*");

        return c.json({ success: true, data: result });
    },
);

// DELETE /api/manga/:id - Delete manga (admin only)
mangaRoutes.delete("/:id", authMiddleware, adminMiddleware, async (c) => {
    const id = c.req.param("id");

    const [result] = await db.delete(manga).where(eq(manga.id, id)).returning();

    if (!result) {
        return c.json({ success: false, error: "Manga not found" }, 404);
    }

    // Invalidate caches
    await cache.del(`manga:${result.slug}`);
    await cache.delPattern("manga:list:*");

    return c.json({ success: true, message: "Manga deleted" });
});
