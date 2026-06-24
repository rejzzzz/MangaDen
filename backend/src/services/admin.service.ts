import { db } from "../db/index.js";
import { manga, chapters, users, activityLogs, siteSettings, mangaViews } from "../db/schema/index.js";
import { count, sum, eq, desc, asc, ilike, and, sql, gte, countDistinct } from "drizzle-orm";

export class AdminService {
    static async getStats() {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const [totalManga] = await db.select({ count: count() }).from(manga);
        const [totalChapters] = await db.select({ count: count() }).from(chapters);
        const [totalUsers] = await db.select({ count: count() }).from(users);
        const [totalViews] = await db.select({ count: sum(manga.viewCount) }).from(manga);

        const [newMangaThisMonth] = await db.select({ count: count() }).from(manga).where(gte(manga.createdAt, thirtyDaysAgo));
        const [newUsersThisMonth] = await db.select({ count: count() }).from(users).where(gte(users.createdAt, thirtyDaysAgo));
        const [viewsThisMonth] = await db.select({ count: count() }).from(mangaViews).where(gte(mangaViews.createdAt, thirtyDaysAgo));
        const [activeUsers] = await db.select({ count: countDistinct(mangaViews.userId) }).from(mangaViews).where(gte(mangaViews.createdAt, thirtyDaysAgo));

        return {
            totalManga: totalManga?.count || 0,
            totalChapters: totalChapters?.count || 0,
            totalUsers: totalUsers?.count || 0,
            totalViews: Number(totalViews?.count) || 0,
            newMangaThisMonth: newMangaThisMonth?.count || 0,
            newUsersThisMonth: newUsersThisMonth?.count || 0,
            viewsThisMonth: viewsThisMonth?.count || 0,
            activeUsers: activeUsers?.count || 0,
        };
    }

    static async getActivity(limit = 20) {
        return db.select().from(activityLogs).orderBy(desc(activityLogs.createdAt)).limit(limit);
    }

    static async logActivity(actorId: string, actorName: string, action: string, summary: string, targetType?: string, targetId?: string) {
        await db.insert(activityLogs).values({ actorId, actorName, action, summary, targetType, targetId });
    }

    static async getSettings() {
        const settingsList = await db.select().from(siteSettings).where(eq(siteSettings.id, "default")).limit(1);
        if (settingsList.length === 0) {
            const [newSettings] = await db.insert(siteSettings).values({ id: "default" }).returning();
            return newSettings;
        }
        return settingsList[0];
    }

    static async updateSettings(data: any) {
        const [updated] = await db.update(siteSettings).set({ ...data, updatedAt: new Date() }).where(eq(siteSettings.id, "default")).returning();
        return updated;
    }

    static async getAnalytics(period: string) {
        let days = 30;
        if (period === "7d") days = 7;
        else if (period === "90d") days = 90;
        
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const viewsOverTime = await db
            .select({
                date: sql<string>`to_char(${mangaViews.createdAt}, 'YYYY-MM-DD')`,
                value: count(),
            })
            .from(mangaViews)
            .where(gte(mangaViews.createdAt, startDate))
            .groupBy(sql`to_char(${mangaViews.createdAt}, 'YYYY-MM-DD')`)
            .orderBy(asc(sql`to_char(${mangaViews.createdAt}, 'YYYY-MM-DD')`));

        const signupsOverTime = await db
            .select({
                date: sql<string>`to_char(${users.createdAt}, 'YYYY-MM-DD')`,
                value: count(),
            })
            .from(users)
            .where(gte(users.createdAt, startDate))
            .groupBy(sql`to_char(${users.createdAt}, 'YYYY-MM-DD')`)
            .orderBy(asc(sql`to_char(${users.createdAt}, 'YYYY-MM-DD')`));

        const topManga = await db
            .select({
                id: manga.id,
                title: manga.title,
                slug: manga.slug,
                views: manga.viewCount,
            })
            .from(manga)
            .orderBy(desc(manga.viewCount))
            .limit(10);

        const typeBreakdown = await db
            .select({
                type: manga.type,
                count: count(),
            })
            .from(manga)
            .groupBy(manga.type);

        const statusBreakdown = await db
            .select({
                status: manga.status,
                count: count(),
            })
            .from(manga)
            .groupBy(manga.status);

        return {
            viewsOverTime,
            signupsOverTime,
            topManga,
            typeBreakdown,
            statusBreakdown
        };
    }

    // Manga Management
    static async listManga(page: number, limit: number, search?: string, status?: string, type?: string) {
        const offset = (page - 1) * limit;
        const conditions = [];

        if (search) conditions.push(ilike(manga.title, `%${search}%`));
        if (status) conditions.push(eq(manga.status, status as any));
        if (type) conditions.push(eq(manga.type, type as any));

        const where = conditions.length > 0 ? and(...conditions) : undefined;

        const results = await db.select().from(manga).where(where).orderBy(desc(manga.createdAt)).limit(limit).offset(offset);
        const [totalResult] = await db.select({ count: count() }).from(manga).where(where);
        const total = totalResult?.count || 0;

        return {
            data: results,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    // Users Management
    static async listUsers(page: number, limit: number, search?: string, role?: string, status?: string) {
        const offset = (page - 1) * limit;
        const conditions = [];

        if (search) conditions.push(ilike(users.email, `%${search}%`));
        if (role) conditions.push(eq(users.role, role as any));
        if (status) conditions.push(eq(users.status, status as any));

        const where = conditions.length > 0 ? and(...conditions) : undefined;

        const results = await db.select().from(users).where(where).orderBy(desc(users.createdAt)).limit(limit).offset(offset);
        const [totalResult] = await db.select({ count: count() }).from(users).where(where);
        const total = totalResult?.count || 0;

        return {
            data: results.map(u => ({ ...u, passwordHash: undefined })),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }
}
