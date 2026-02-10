import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "../db/index";
import { chapters, pages, manga } from "../db/schema/index";
import { eq, ne, desc, asc } from "drizzle-orm";
import { cache } from "../lib/redis";

export const chapterRoutes = new Hono();

// Validation schemas
const createChapterSchema = z.object({
    mangaId: z.string().uuid(),
    number: z.number().int().positive(),
    title: z.string().max(255).optional(),
    slug: z.string().min(1).max(255),
});

// GET /api/chapters/:mangaSlug - Get all chapters for a manga
chapterRoutes.get("/manga/:mangaSlug", async (c) => {
    const mangaSlug = c.req.param("mangaSlug");

    const cacheKey = `chapters:${mangaSlug}`;
    const cached = await cache.get(cacheKey);
    if (cached) {
        return c.json({ success: true, data: cached, cached: true });
    }

    const mangaRecord = await db.query.manga.findFirst({
        where: eq(manga.slug, mangaSlug),
    });

    if (!mangaRecord) {
        return c.json({ success: false, error: "Manga not found" }, 404);
    }

    const result = await db
        .select()
        .from(chapters)
        .where(eq(chapters.mangaId, mangaRecord.id))
        .orderBy(asc(chapters.number));

    await cache.set(cacheKey, result, 600);

    return c.json({ success: true, data: result });
});

// GET /api/chapters/:chapterId/pages - Get all pages for a chapter
chapterRoutes.get("/:chapterId/pages", async (c) => {
    const chapterId = c.req.param("chapterId");

    const cacheKey = `pages:${chapterId}`;
    const cached = await cache.get(cacheKey);
    if (cached) {
        return c.json({ success: true, data: cached, cached: true });
    }

    const chapter = await db.query.chapters.findFirst({
        where: eq(chapters.id, chapterId),
        with: {
            pages: {
                orderBy: (pages, { asc }) => [asc(pages.pageNumber)],
            },
        },
    });

    if (!chapter) {
        return c.json({ success: false, error: "Chapter not found" }, 404);
    }

    await cache.set(cacheKey, chapter, 3600); // Cache for 1 hour

    return c.json({ success: true, data: chapter });
});

// POST /api/chapters - Create chapter
chapterRoutes.post("/", zValidator("json", createChapterSchema), async (c) => {
    const body = c.req.valid("json");

    const [result] = await db.insert(chapters).values({
        mangaId: body.mangaId!,
        number: body.number!,
        slug: body.slug!,
        title: body.title,
        pageCount: 0,
    }).returning();

    // Invalidate manga cache
    const mangaRecord = await db.query.manga.findFirst({
        where: eq(manga.id, body.mangaId),
    });
    if (mangaRecord) {
        await cache.del(`chapters:${mangaRecord.slug}`);
        await cache.del(`manga:${mangaRecord.slug}`);
    }

    return c.json({ success: true, data: result }, 201);
});

// DELETE /api/chapters/:id
chapterRoutes.delete("/:id", async (c) => {
    const id = c.req.param("id");

    const chapter = await db.query.chapters.findFirst({
        where: eq(chapters.id, id),
    });

    if (!chapter) {
        return c.json({ success: false, error: "Chapter not found" }, 404);
    }

    await db.delete(chapters).where(eq(chapters.id, id));

    // Invalidate caches
    await cache.del(`pages:${id}`);

    return c.json({ success: true, message: "Chapter deleted" });
});
