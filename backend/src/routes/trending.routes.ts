import { Hono } from "hono";
import {
    getTrendingManga,
    type TimePeriod,
} from "../services/trending.service.js";

export const trendingRoutes = new Hono();

/**
 * GET /api/trending
 * Get trending manga with optional time period and pagination
 * Query params:
 *   - period: "1d" | "7d" | "30d" (default: "7d")
 *   - limit: number (1-50, default: 20)
 *   - offset: number (default: 0)
 */
trendingRoutes.get("/", async (c) => {
    try {
        const period = (c.req.query("period") as string) || "7d";
        const limit = Math.min(
            Math.max(parseInt(c.req.query("limit") as string) || 20, 1),
            50,
        );
        const offset = Math.max(
            parseInt(c.req.query("offset") as string) || 0,
            0,
        );

        const result = await getTrendingManga(period, limit, offset);

        return c.json({
            success: true,
            data: result,
        });
    } catch (error) {
        console.error("Trending endpoint error:", error);
        return c.json(
            {
                success: false,
                error:
                    error instanceof Error
                        ? error.message
                        : "Failed to fetch trending manga",
            },
            400,
        );
    }
});
