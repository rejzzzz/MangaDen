import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "../db/index.js";
import { pages, chapters } from "../db/schema/index.js";
import { eq } from "drizzle-orm";
import { cache } from "../lib/redis.js";
import { pdfQueue } from "../lib/pdf-queue.js";
import { processPdfToPages } from "../lib/pdf-processor.js";
import {
    authMiddleware,
    adminMiddleware,
} from "../middleware/auth.middleware.js";

export const pagesRoutes = new Hono();

const addPageSchema = z.object({
    pageNumber: z.number().int().positive(),
    imageUrl: z.string().url(),
    width: z.number().int().optional(),
    height: z.number().int().optional(),
});

const bulkAddPagesSchema = z.object({
    pages: z.array(addPageSchema).min(1),
});

// POST /api/pages/chapters/:chapterId/pdf - Upload and process PDF
pagesRoutes.post(
    "/chapters/:chapterId/pdf",
    authMiddleware,
    adminMiddleware,
    async (c) => {
        const chapterId = c.req.param("chapterId");
        const body = await c.req.parseBody();
        const file = body["file"];

        if (!file || !(file instanceof File)) {
            return c.json(
                { success: false, error: "No PDF file uploaded" },
                400,
            );
        }

        const chapter = await db.query.chapters.findFirst({
            where: eq(chapters.id, chapterId),
        });

        if (!chapter) {
            return c.json({ success: false, error: "Chapter not found" }, 404);
        }

        const pdfBuffer = Buffer.from(await file.arrayBuffer());
        const jobId = await pdfQueue.createJob(chapterId);

        // Process asynchronously
        processPdfToPages(pdfBuffer, chapterId)
            .then(async (processedPages) => {
                const inserted = await db
                    .insert(pages)
                    .values(processedPages.map((p) => ({ chapterId, ...p })))
                    .returning();

                await db
                    .update(chapters)
                    .set({ pageCount: inserted.length })
                    .where(eq(chapters.id, chapterId));

                await cache.del(`pages:${chapterId}`);
                await pdfQueue.updateJob(jobId, {
                    status: "completed",
                    pagesCount: inserted.length,
                });
            })
            .catch(async (error) => {
                console.error(`PDF processing failed for job ${jobId}:`, error);
                await pdfQueue.updateJob(jobId, {
                    status: "failed",
                    error: error.message,
                });
            });

        return c.json({ success: true, jobId }, 202);
    },
);

// GET /api/pages/job/:jobId - Check PDF processing status
pagesRoutes.get("/job/:jobId", authMiddleware, adminMiddleware, async (c) => {
    const jobId = c.req.param("jobId");
    const job = await pdfQueue.getJob(jobId);

    if (!job) {
        return c.json({ success: false, error: "Job not found" }, 404);
    }

    return c.json({ success: true, data: job });
});

// POST /api/pages/chapters/:chapterId - Add a single page
pagesRoutes.post(
    "/chapters/:chapterId",
    authMiddleware,
    adminMiddleware,
    zValidator("json", addPageSchema),
    async (c) => {
        const chapterId = c.req.param("chapterId");
        const body = c.req.valid("json");

        const chapter = await db.query.chapters.findFirst({
            where: eq(chapters.id, chapterId),
        });

        if (!chapter) {
            return c.json({ success: false, error: "Chapter not found" }, 404);
        }

        const [page] = await db
            .insert(pages)
            .values({ chapterId, ...body })
            .returning();

        // Update page count
        await db
            .update(chapters)
            .set({ pageCount: chapter.pageCount + 1 })
            .where(eq(chapters.id, chapterId));

        // Invalidate chapter pages cache
        await cache.del(`pages:${chapterId}`);

        return c.json({ success: true, data: page }, 201);
    },
);

// POST /api/pages/chapters/:chapterId/bulk - Add multiple pages at once
pagesRoutes.post(
    "/chapters/:chapterId/bulk",
    authMiddleware,
    adminMiddleware,
    zValidator("json", bulkAddPagesSchema),
    async (c) => {
        const chapterId = c.req.param("chapterId");
        const { pages: pageList } = c.req.valid("json");

        const chapter = await db.query.chapters.findFirst({
            where: eq(chapters.id, chapterId),
        });

        if (!chapter) {
            return c.json({ success: false, error: "Chapter not found" }, 404);
        }

        const inserted = await db
            .insert(pages)
            .values(pageList.map((p) => ({ chapterId, ...p })))
            .returning();

        // Update page count
        await db
            .update(chapters)
            .set({ pageCount: chapter.pageCount + inserted.length })
            .where(eq(chapters.id, chapterId));

        await cache.del(`pages:${chapterId}`);

        return c.json(
            { success: true, data: inserted, count: inserted.length },
            201,
        );
    },
);

// DELETE /api/pages/:id - Delete a single page
pagesRoutes.delete("/:id", authMiddleware, adminMiddleware, async (c) => {
    const id = c.req.param("id");

    const page = await db.query.pages.findFirst({
        where: eq(pages.id, id),
    });

    if (!page) {
        return c.json({ success: false, error: "Page not found" }, 404);
    }

    await db.delete(pages).where(eq(pages.id, id));

    // Decrement page count on the chapter
    const chapter = await db.query.chapters.findFirst({
        where: eq(chapters.id, page.chapterId),
    });

    if (chapter) {
        await db
            .update(chapters)
            .set({ pageCount: Math.max(0, chapter.pageCount - 1) })
            .where(eq(chapters.id, page.chapterId));

        await cache.del(`pages:${page.chapterId}`);
    }

    return c.json({ success: true, message: "Page deleted" });
});
