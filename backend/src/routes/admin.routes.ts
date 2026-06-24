import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "../db/index.js";
import { manga, chapters, pages, users } from "../db/schema/index.js";
import { eq } from "drizzle-orm";
import { authMiddleware, adminMiddleware } from "../middleware/auth.middleware.js";
import { AdminService } from "../services/admin.service.js";
import { cache } from "../lib/cache/redis.js";

export const adminRoutes = new Hono();

adminRoutes.use("*", authMiddleware, adminMiddleware);

// Helpers
const getActor = (c: any) => ({
    id: c.get("user")?.id || "unknown",
    name: c.get("user")?.username || "Admin"
});

// 1. Dashboard
adminRoutes.get("/stats", async (c) => {
    const stats = await AdminService.getStats();
    return c.json({ success: true, data: stats });
});

adminRoutes.get("/activity", async (c) => {
    const limit = Number(c.req.query("limit")) || 20;
    const activity = await AdminService.getActivity(limit);
    return c.json({ success: true, data: activity });
});

// 2. Manga
adminRoutes.get("/manga", async (c) => {
    const page = Number(c.req.query("page")) || 1;
    const limit = Number(c.req.query("limit")) || 20;
    const search = c.req.query("search");
    const status = c.req.query("status");
    const type = c.req.query("type");
    
    const result = await AdminService.listManga(page, limit, search, status, type);
    return c.json({ success: true, ...result });
});

adminRoutes.get("/manga/:id", async (c) => {
    const id = c.req.param("id");
    const [result] = await db.select().from(manga).where(eq(manga.id, id));
    if (!result) return c.json({ success: false, message: "Not found" }, 404);
    return c.json({ success: true, data: result });
});

// POST /api/admin/manga
adminRoutes.post("/manga", zValidator("json", z.object({
    title: z.string(),
    slug: z.string().optional(),
    description: z.string(),
    coverUrl: z.string(),
    bannerUrl: z.string().optional(),
    author: z.string(),
    artist: z.string().optional(),
    status: z.enum(["ongoing", "completed", "hiatus", "cancelled"]),
    type: z.enum(["manga", "manhwa", "manhua", "webtoon"]),
    releaseYear: z.number().optional(),
    isNsfw: z.boolean(),
    isPublished: z.boolean().optional(),
})), async (c) => {
    const body = c.req.valid("json");
    const slug = body.slug || body.title.toLowerCase().replace(/ /g, "-");
    const [result] = await db.insert(manga).values({ ...body, slug }).returning();
    if (!result) return c.json({ success: false, message: "Failed to create" }, 500);
    const actor = getActor(c);
    await AdminService.logActivity(actor.id, actor.name, "manga.create", `Created manga "${result.title}"`, "manga", result.id);
    await cache.delPattern("manga:list:*");
    return c.json({ success: true, data: result });
});

adminRoutes.patch("/manga/:id", async (c) => {
    const id = c.req.param("id");
    const body = await c.req.json();
    const [result] = await db.update(manga).set({ ...body, updatedAt: new Date() }).where(eq(manga.id, id)).returning();
    if (!result) return c.json({ success: false, message: "Not found" }, 404);
    const actor = getActor(c);
    await AdminService.logActivity(actor.id, actor.name, "manga.update", `Updated manga "${result.title}"`, "manga", result.id);
    await cache.del(`manga:${result.slug}`);
    await cache.delPattern("manga:list:*");
    return c.json({ success: true, data: result });
});

adminRoutes.delete("/manga/:id", async (c) => {
    const id = c.req.param("id");
    const [result] = await db.delete(manga).where(eq(manga.id, id)).returning();
    if (!result) return c.json({ success: false, message: "Not found" }, 404);
    const actor = getActor(c);
    await AdminService.logActivity(actor.id, actor.name, "manga.delete", `Deleted manga "${result.title}"`, "manga", result.id);
    await cache.del(`manga:${result.slug}`);
    await cache.delPattern("manga:list:*");
    return c.json({ success: true, message: "Deleted" });
});

// 3. Chapters
adminRoutes.post("/chapters", async (c) => {
    const body = await c.req.json();
    const [result] = await db.insert(chapters).values({ ...body, slug: `chapter-${body.number}` }).returning();
    if (!result) return c.json({ success: false, message: "Failed to create" }, 500);
    const actor = getActor(c);
    await AdminService.logActivity(actor.id, actor.name, "chapter.create", `Created chapter ${result.number}`, "chapter", result.id);
    return c.json({ success: true, data: result });
});

adminRoutes.patch("/chapters/:id", async (c) => {
    const id = c.req.param("id");
    const body = await c.req.json();
    const [result] = await db.update(chapters).set(body).where(eq(chapters.id, id)).returning();
    if (!result) return c.json({ success: false, message: "Not found" }, 404);
    const actor = getActor(c);
    await AdminService.logActivity(actor.id, actor.name, "chapter.update", `Updated chapter ${result.number}`, "chapter", result.id);
    return c.json({ success: true, data: result });
});

adminRoutes.delete("/chapters/:id", async (c) => {
    const id = c.req.param("id");
    const [result] = await db.delete(chapters).where(eq(chapters.id, id)).returning();
    if (!result) return c.json({ success: false, message: "Not found" }, 404);
    const actor = getActor(c);
    await AdminService.logActivity(actor.id, actor.name, "chapter.delete", `Deleted chapter ${result.number}`, "chapter", result.id);
    return c.json({ success: true, message: "Deleted" });
});

adminRoutes.put("/chapters/:id/pages", async (c) => {
    const id = c.req.param("id");
    const body = await c.req.json(); // { pages: ["url1", "url2"] }
    await db.delete(pages).where(eq(pages.chapterId, id));
    
    if (body.pages && body.pages.length > 0) {
        const pageRecords = body.pages.map((url: string, index: number) => ({
            chapterId: id,
            pageNumber: index + 1,
            imageUrl: url
        }));
        await db.insert(pages).values(pageRecords);
        await db.update(chapters).set({ pageCount: body.pages.length }).where(eq(chapters.id, id));
    } else {
        await db.update(chapters).set({ pageCount: 0 }).where(eq(chapters.id, id));
    }
    
    const chapter = await db.query.chapters.findFirst({
        where: eq(chapters.id, id),
        with: { pages: { orderBy: (pages, { asc }) => [asc(pages.pageNumber)] } }
    });
    
    const actor = getActor(c);
    await AdminService.logActivity(actor.id, actor.name, "chapter.pages", `Updated pages for chapter`, "chapter", id);
    return c.json({ success: true, data: chapter });
});

// 4. Users
adminRoutes.get("/users", async (c) => {
    const page = Number(c.req.query("page")) || 1;
    const limit = Number(c.req.query("limit")) || 20;
    const search = c.req.query("search");
    const role = c.req.query("role");
    const status = c.req.query("status");
    
    const result = await AdminService.listUsers(page, limit, search, role, status);
    return c.json({ success: true, ...result });
});

adminRoutes.patch("/users/:id/role", async (c) => {
    const id = c.req.param("id");
    const body = await c.req.json();
    const [result] = await db.update(users).set({ role: body.role }).where(eq(users.id, id)).returning();
    if (!result) return c.json({ success: false, message: "Not found" }, 404);
    const actor = getActor(c);
    await AdminService.logActivity(actor.id, actor.name, "user.role", `Changed role to ${body.role}`, "user", id);
    return c.json({ success: true, data: { ...result, passwordHash: undefined } });
});

adminRoutes.patch("/users/:id/status", async (c) => {
    const id = c.req.param("id");
    const body = await c.req.json();
    const [result] = await db.update(users).set({ status: body.status }).where(eq(users.id, id)).returning();
    if (!result) return c.json({ success: false, message: "Not found" }, 404);
    const actor = getActor(c);
    await AdminService.logActivity(actor.id, actor.name, "user.status", `Changed status to ${body.status}`, "user", id);
    return c.json({ success: true, data: { ...result, passwordHash: undefined } });
});

adminRoutes.delete("/users/:id", async (c) => {
    const id = c.req.param("id");
    const [result] = await db.delete(users).where(eq(users.id, id)).returning();
    if (!result) return c.json({ success: false, message: "Not found" }, 404);
    const actor = getActor(c);
    await AdminService.logActivity(actor.id, actor.name, "user.delete", `Deleted user ${result.email}`, "user", id);
    return c.json({ success: true, message: "Deleted" });
});

// 5. Analytics
adminRoutes.get("/analytics", async (c) => {
    const period = c.req.query("period") || "30d";
    const data = await AdminService.getAnalytics(period);
    return c.json({ success: true, data });
});

// 6. Settings
adminRoutes.get("/settings", async (c) => {
    const data = await AdminService.getSettings();
    return c.json({ success: true, data });
});

adminRoutes.put("/settings", async (c) => {
    const body = await c.req.json();
    const data = await AdminService.updateSettings(body);
    const actor = getActor(c);
    await AdminService.logActivity(actor.id, actor.name, "setting.update", `Updated site settings`, "setting", "default");
    return c.json({ success: true, data });
});
