import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "../db/index.js";
import { favorites, manga, readingProgress, users } from "../db/schema/index.js";
import { eq, and } from "drizzle-orm";
import { cache } from "../lib/cache/redis.js";
import { authMiddleware, AppEnv } from "../middleware/auth.middleware.js";
import { uploadImage } from "../lib/storage/cloudinary.js";

export const userRoutes = new Hono<AppEnv>();

userRoutes.use("*", authMiddleware);

const bookmarkCacheKey = (userId: string) => `bookmarks:${userId}`;

// GET /api/user/bookmarks
userRoutes.get("/bookmarks", async (c) => {
    const user = c.get("user");

    const cached = await cache.get(bookmarkCacheKey(user.id));
    if (cached) return c.json({ success: true, data: cached, cached: true });

    const result = await db
        .select({ manga })
        .from(favorites)
        .innerJoin(manga, eq(favorites.mangaId, manga.id))
        .where(eq(favorites.userId, user.id));

    const data = result.map((r) => r.manga);
    await cache.set(bookmarkCacheKey(user.id), data, 300);

    return c.json({ success: true, data });
});

// POST /api/user/bookmarks/:mangaId
userRoutes.post("/bookmarks/:mangaId", async (c) => {
    const user = c.get("user");
    const mangaId = c.req.param("mangaId");

    const exists = await db.query.favorites.findFirst({
        where: and(
            eq(favorites.userId, user.id),
            eq(favorites.mangaId, mangaId),
        ),
    });

    if (exists)
        return c.json({ success: false, error: "Already bookmarked" }, 409);

    const [result] = await db
        .insert(favorites)
        .values({ userId: user.id, mangaId })
        .returning();

    await cache.del(bookmarkCacheKey(user.id));

    return c.json({ success: true, data: result }, 201);
});

// DELETE /api/user/bookmarks/:mangaId
userRoutes.delete("/bookmarks/:mangaId", async (c) => {
    const user = c.get("user");
    const mangaId = c.req.param("mangaId");

    const [result] = await db
        .delete(favorites)
        .where(
            and(eq(favorites.userId, user.id), eq(favorites.mangaId, mangaId)),
        )
        .returning();

    if (!result)
        return c.json({ success: false, error: "Bookmark not found" }, 404);

    await cache.del(bookmarkCacheKey(user.id));

    return c.json({ success: true, message: "Bookmark removed" });
});

const progressSchema = z.object({
    mangaId: z.string().uuid(),
    chapterId: z.string().uuid(),
    pageNumber: z.number().int().positive().default(1),
});

// GET /api/user/progress/:mangaId - Get reading progress for a manga
userRoutes.get("/progress/:mangaId", async (c) => {
    const user = c.get("user");
    const mangaId = c.req.param("mangaId");

    const cacheKey = `progress:${user.id}:${mangaId}`;
    const cached = await cache.get(cacheKey);
    if (cached) return c.json({ success: true, data: cached, cached: true });

    const result = await db.query.readingProgress.findFirst({
        where: and(
            eq(readingProgress.userId, user.id),
            eq(readingProgress.mangaId, mangaId),
        ),
        with: { chapter: true },
    });

    if (!result) return c.json({ success: true, data: null });

    await cache.set(cacheKey, result, 300);
    return c.json({ success: true, data: result });
});

// POST /api/user/progress - Upsert reading progress
userRoutes.post("/progress", zValidator("json", progressSchema), async (c) => {
    const user = c.get("user");
    const { mangaId, chapterId, pageNumber } = c.req.valid("json");

    const [result] = await db
        .insert(readingProgress)
        .values({ userId: user.id, mangaId, chapterId, pageNumber })
        .onConflictDoUpdate({
            target: [readingProgress.userId, readingProgress.mangaId],
            set: { chapterId, pageNumber, updatedAt: new Date() },
        })
        .returning();

    await cache.del(`progress:${user.id}:${mangaId}`);

    return c.json({ success: true, data: result });
});

// GET /api/user/progress - Get all reading progress for the user
userRoutes.get("/progress", async (c) => {
    const user = c.get("user");
    const cacheKey = `progress:${user.id}:all`;

    const cached = await cache.get(cacheKey);
    if (cached) return c.json({ success: true, data: cached, cached: true });

    const result = await db.query.readingProgress.findMany({
        where: eq(readingProgress.userId, user.id),
        with: { chapter: true },
    });

    await cache.set(cacheKey, result, 120);
    return c.json({ success: true, data: result });
});

// POST /api/user/avatar - Upload profile picture and update user profile
userRoutes.post("/avatar", async (c) => {
    const user = c.get("user");

    try {
        const body = await c.req.parseBody();
        const file = body["file"];

        if (!file || !(file instanceof File)) {
            return c.json({ success: false, error: "No image file uploaded" }, 400);
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const uploadResult = await uploadImage(buffer, "avatars", `user-${user.id}`);

        const [updatedUser] = await db
            .update(users)
            .set({ avatarUrl: uploadResult.secure_url, updatedAt: new Date() })
            .where(eq(users.id, user.id))
            .returning();

        if (!updatedUser) {
            return c.json({ success: false, error: "User not found" }, 404);
        }

        return c.json({
            success: true,
            data: {
                user: updatedUser,
                avatarUrl: uploadResult.secure_url,
            },
        });
    } catch (error) {
        console.error("Avatar upload error:", error);
        return c.json({ success: false, error: "Failed to upload avatar" }, 500);
    }
});
