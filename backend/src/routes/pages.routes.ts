import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "../db/index.js";
import { pages, chapters } from "../db/schema/index.js";
import { eq } from "drizzle-orm";
import { cache } from "../lib/cache/redis.js";
import { pdfQueue } from "../lib/pdf/queue.js";
import { processPdfToPages } from "../lib/pdf/processor.js";
import {
    authMiddleware,
    adminMiddleware,
} from "../middleware/auth.middleware.js";
import os from "os";
import path from "path";
import fs from "fs/promises";
import { randomUUID } from "crypto";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

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
        console.log(`[Upload] Starting PDF upload for chapter: ${chapterId}`);

        let body;
        try {
            console.log(`[Upload] Parsing request body...`);
            body = await c.req.parseBody();
            console.log(`[Upload] Request body parsed successfully.`);
        } catch (e: any) {
            console.error(`[Upload] Failed to parse request body:`, e.message);
            return c.json({ success: false, error: "Failed to parse body" }, 400);
        }

        const file = body["file"];

        if (!file || !(file instanceof File)) {
            console.error(`[Upload] No valid PDF file uploaded.`);
            return c.json(
                { success: false, error: "No PDF file uploaded" },
                400,
            );
        }

        console.log(`[Upload] File received: name=${file.name}, type=${file.type}, size=${file.size}`);

        if (file.type !== "application/pdf") {
            return c.json({ success: false, error: "File must be a PDF" }, 400);
        }

        if (file.size > MAX_FILE_SIZE) {
            return c.json({ success: false, error: "File size exceeds 50MB limit" }, 413);
        }

        const chapter = await db.query.chapters.findFirst({
            where: eq(chapters.id, chapterId),
        });

        if (!chapter) {
            console.error(`[Upload] Chapter ${chapterId} not found.`);
            return c.json({ success: false, error: "Chapter not found" }, 404);
        }

        const tempFilePath = path.join(os.tmpdir(), `upload-${randomUUID()}.pdf`);
        console.log(`[Upload] Saving temp file to: ${tempFilePath}`);
        const arrayBuffer = await file.arrayBuffer();
        await fs.writeFile(tempFilePath, Buffer.from(arrayBuffer));
        console.log(`[Upload] Temp file saved successfully.`);

        const jobId = await pdfQueue.createJob(chapterId, tempFilePath);
        console.log(`[Upload] Job created: ${jobId}, triggering background processing...`);

        // Process asynchronously
        processPdfToPages(tempFilePath, chapterId)
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
