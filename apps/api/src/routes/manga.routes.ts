import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "../db";
import { manga } from "../db/schema";
import { eq, desc, ilike, and } from "drizzle-orm";
import { cache } from "../lib/redis";

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
    const conditions = [];

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

// POST /api/manga - Create manga (admin only - TODO: add auth)
mangaRoutes.post("/", zValidator("json", createMangaSchema), async (c) => {
    const body = c.req.valid("json");

    const [result] = await db.insert(manga).values(body).returning();

    // Invalidate list cache
    await cache.delPattern("manga:list:*");

    return c.json({ success: true, data: result }, 201);
});

// PATCH /api/manga/:id - Update manga
mangaRoutes.patch("/:id", zValidator("json", createMangaSchema.partial()), async (c) => {
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
});

// DELETE /api/manga/:id - Delete manga
mangaRoutes.delete("/:id", async (c) => {
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
