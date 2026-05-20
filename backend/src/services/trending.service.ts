import { db } from "../db/index.js";
import { manga } from "../db/schema/index.js";
import { sql, inArray } from "drizzle-orm";
import { cache } from "../lib/redis.js";

type TimePeriod = "1d" | "7d" | "30d";

/**
 * Cache configuration for trending data
 * TTL values in seconds
 */
const CACHE_CONFIG = {
    TRENDING_TTL: 3 * 60 * 60, // 3 hours
    METRICS_TTL: 1 * 60 * 60, // 1 hour
} as const;

/**
 * Generate cache key for trending results
 * @param period - Time period
 * @param limit - Results per page
 * @param offset - Starting position
 * @returns Cache key string
 */
function generateTrendingCacheKey(
    period: TimePeriod,
    limit: number,
    offset: number,
): string {
    return `trending:${period}:${limit}:${offset}`;
}

/**
 * Generate cache key for metrics
 * @param period - Time period
 * @returns Cache key string
 */
function generateMetricsCacheKey(period: TimePeriod): string {
    return `trending:metrics:${period}`;
}

/**
 * Cache manager for trending data
 * Handles all caching operations with error resilience
 */
class TrendingCacheManager {
    /**
     * Get cached trending results
     * @param period - Time period
     * @param limit - Results per page
     * @param offset - Starting position
     * @returns Cached result or null if not found/expired
     */
    async getTrendingResult(
        period: TimePeriod,
        limit: number,
        offset: number,
    ): Promise<TrendingResult | null> {
        try {
            const key = generateTrendingCacheKey(period, limit, offset);
            const cached = await cache.get<TrendingResult>(key);
            if (cached) {
                return { ...cached, cached: true };
            }
            return null;
        } catch (error) {
            console.error(
                "[TrendingCache] Error retrieving trending result:",
                error,
            );
            return null; // Graceful fallback
        }
    }

    /**
     * Cache trending results
     * @param period - Time period
     * @param limit - Results per page
     * @param offset - Starting position
     * @param result - Result to cache
     */
    async setTrendingResult(
        period: TimePeriod,
        limit: number,
        offset: number,
        result: TrendingResult,
    ): Promise<void> {
        try {
            const key = generateTrendingCacheKey(period, limit, offset);
            await cache.set(key, result, CACHE_CONFIG.TRENDING_TTL);
        } catch (error) {
            console.error(
                "[TrendingCache] Error caching trending result:",
                error,
            );
            // Non-blocking error - continue without cache
        }
    }

    /**
     * Get cached metrics
     * @param period - Time period
     * @returns Cached metrics or null if not found/expired
     */
    async getMetrics(period: TimePeriod): Promise<TrendingScore[] | null> {
        try {
            const key = generateMetricsCacheKey(period);
            const cached = await cache.get<TrendingScore[]>(key);
            return cached || null;
        } catch (error) {
            console.error("[TrendingCache] Error retrieving metrics:", error);
            return null; // Graceful fallback
        }
    }

    /**
     * Cache metrics
     * @param period - Time period
     * @param scores - Scores to cache
     */
    async setMetrics(
        period: TimePeriod,
        scores: TrendingScore[],
    ): Promise<void> {
        try {
            const key = generateMetricsCacheKey(period);
            await cache.set(key, scores, CACHE_CONFIG.METRICS_TTL);
        } catch (error) {
            console.error("[TrendingCache] Error caching metrics:", error);
            // Non-blocking error - continue without cache
        }
    }

    /**
     * Invalidate all trending cache for a period
     * Useful when data is updated
     * @param period - Time period to invalidate
     */
    async invalidatePeriod(period: TimePeriod): Promise<void> {
        try {
            // Invalidate both metrics and all pagination variants
            const metricsKey = generateMetricsCacheKey(period);
            const trendingPattern = `trending:${period}:*`;

            await cache.del(metricsKey);
            await cache.delPattern(trendingPattern);
        } catch (error) {
            console.error("[TrendingCache] Error invalidating cache:", error);
            // Non-blocking error
        }
    }

    /**
     * Invalidate all trending cache
     * Useful for full cache refresh
     */
    async invalidateAll(): Promise<void> {
        try {
            await cache.delPattern("trending:*");
        } catch (error) {
            console.error(
                "[TrendingCache] Error invalidating all cache:",
                error,
            );
            // Non-blocking error
        }
    }
}

// Singleton instance
const cacheManager = new TrendingCacheManager();

interface TrendingMetrics {
    mangaId: string;
    views: number;
    bookmarks: number;
    ratings: number;
    comments: number;
}

interface NormalizedMetrics extends TrendingMetrics {
    normalizedViews: number;
    normalizedBookmarks: number;
    normalizedRatings: number;
    normalizedComments: number;
}

interface TrendingScore {
    mangaId: string;
    title: string;
    slug: string;
    coverUrl: string | null;
    score: number;
    rank: number;
    metrics: TrendingMetrics;
}

interface TrendingResult {
    period: TimePeriod;
    limit: number;
    offset: number;
    total: number;
    manga: Array<{
        id: string;
        title: string;
        slug: string;
        coverUrl: string | null;
        score: number;
        rank: number;
        metrics: TrendingMetrics;
    }>;
    generatedAt: string;
    expiresAt: string;
    cached?: boolean;
}

/**
 * Get time window start date for a given period
 * @param period - Time period (1d, 7d, 30d)
 * @returns Date object representing the start of the time window
 */
function getTimeWindowStart(period: TimePeriod): Date {
    const now = new Date();
    const daysAgo = period === "1d" ? 1 : period === "7d" ? 7 : 30;
    return new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
}

/**
 * Create trending engine tables if they don't exist.
 * Called automatically on first access when tables are missing.
 * Uses IF NOT EXISTS for idempotency.
 */
async function ensureTrendingTables(): Promise<void> {
    try {
        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS "manga_views" (
                "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
                "manga_id" uuid NOT NULL REFERENCES "manga"("id") ON DELETE CASCADE,
                "ip_address" varchar(45),
                "user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
                "created_at" timestamp DEFAULT now() NOT NULL
            );

            CREATE TABLE IF NOT EXISTS "manga_bookmarks" (
                "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
                "manga_id" uuid NOT NULL REFERENCES "manga"("id") ON DELETE CASCADE,
                "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
                "created_at" timestamp DEFAULT now() NOT NULL,
                CONSTRAINT "manga_bookmarks_manga_id_user_id_unique" UNIQUE("manga_id", "user_id")
            );

            CREATE TABLE IF NOT EXISTS "manga_ratings" (
                "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
                "manga_id" uuid NOT NULL REFERENCES "manga"("id") ON DELETE CASCADE,
                "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
                "rating" integer NOT NULL,
                "created_at" timestamp DEFAULT now() NOT NULL,
                "updated_at" timestamp DEFAULT now() NOT NULL,
                CONSTRAINT "manga_ratings_manga_id_user_id_unique" UNIQUE("manga_id", "user_id")
            );

            CREATE TABLE IF NOT EXISTS "manga_comments" (
                "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
                "manga_id" uuid NOT NULL REFERENCES "manga"("id") ON DELETE CASCADE,
                "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
                "content" text NOT NULL,
                "created_at" timestamp DEFAULT now() NOT NULL,
                "updated_at" timestamp DEFAULT now() NOT NULL
            );

            CREATE INDEX IF NOT EXISTS "idx_manga_views_manga_created" ON "manga_views" ("manga_id", "created_at");
            CREATE INDEX IF NOT EXISTS "idx_manga_bookmarks_manga_created" ON "manga_bookmarks" ("manga_id", "created_at");
            CREATE INDEX IF NOT EXISTS "idx_manga_ratings_manga_created" ON "manga_ratings" ("manga_id", "created_at");
            CREATE INDEX IF NOT EXISTS "idx_manga_comments_manga_created" ON "manga_comments" ("manga_id", "created_at");
        `);
        console.log("[Trending] ✅ Trending tables created successfully.");
    } catch (error) {
        console.error("[Trending] ❌ Failed to create trending tables:", error);
        throw error;
    }
}

/**
 * Fetch engagement metrics for all manga within a time period
 * Uses a single aggregated query with UNION ALL for efficiency
 * @param period - Time period to fetch metrics for
 * @returns Array of metrics for each manga
 */
async function fetchMetricsForPeriod(
    period: TimePeriod,
): Promise<TrendingMetrics[]> {
    const timeWindowStart = getTimeWindowStart(period);
    const timeWindowStartISO = timeWindowStart.toISOString();

    try {
        // Fetch all metrics in a single query using UNION ALL
        const result = await db.execute(sql`
            SELECT 
                manga_id,
                COALESCE(SUM(CASE WHEN metric_type = 'views' THEN count ELSE 0 END), 0) as views,
                COALESCE(SUM(CASE WHEN metric_type = 'bookmarks' THEN count ELSE 0 END), 0) as bookmarks,
                COALESCE(SUM(CASE WHEN metric_type = 'ratings' THEN count ELSE 0 END), 0) as ratings,
                COALESCE(SUM(CASE WHEN metric_type = 'comments' THEN count ELSE 0 END), 0) as comments
            FROM (
                SELECT manga_id, 'views' as metric_type, COUNT(*) as count
                FROM manga_views
                WHERE created_at >= ${timeWindowStartISO}
                GROUP BY manga_id
                
                UNION ALL
                
                SELECT manga_id, 'bookmarks' as metric_type, COUNT(*) as count
                FROM manga_bookmarks
                WHERE created_at >= ${timeWindowStartISO}
                GROUP BY manga_id
                
                UNION ALL
                
                SELECT manga_id, 'ratings' as metric_type, COUNT(*) as count
                FROM manga_ratings
                WHERE created_at >= ${timeWindowStartISO}
                GROUP BY manga_id
                
                UNION ALL
                
                SELECT manga_id, 'comments' as metric_type, COUNT(*) as count
                FROM manga_comments
                WHERE created_at >= ${timeWindowStartISO}
                GROUP BY manga_id
            ) metrics
            GROUP BY manga_id
        `);

        // Transform raw results to TrendingMetrics format
        return (result as any[]).map((row: any) => ({
            mangaId: row.manga_id,
            views: Number(row.views) || 0,
            bookmarks: Number(row.bookmarks) || 0,
            ratings: Number(row.ratings) || 0,
            comments: Number(row.comments) || 0,
        }));
    } catch (error: any) {
        // Handle missing tables gracefully (code 42P01 = undefined_table)
        const pgCode = error?.cause?.code ?? error?.code;
        if (pgCode === "42P01") {
            console.warn(
                "[Trending] Trending tables not found. Attempting auto-creation...",
            );
            await ensureTrendingTables();
            // Return empty results for this request; tables will be ready next time
            return [];
        }
        throw error;
    }
}

/**
 * Normalize metrics using min-max normalization
 * Converts all metrics to [0, 1] range for fair weighting
 * Single-pass algorithm for efficiency
 * @param metrics - Raw metrics to normalize
 * @returns Normalized metrics
 */
function normalizeMetrics(metrics: TrendingMetrics[]): NormalizedMetrics[] {
    if (metrics.length === 0) return [];

    // Single pass: find min/max and normalize simultaneously
    const minMax = {
        views: { min: Infinity, max: -Infinity },
        bookmarks: { min: Infinity, max: -Infinity },
        ratings: { min: Infinity, max: -Infinity },
        comments: { min: Infinity, max: -Infinity },
    };

    // First pass: find min and max for each metric
    metrics.forEach((m) => {
        minMax.views.min = Math.min(minMax.views.min, m.views);
        minMax.views.max = Math.max(minMax.views.max, m.views);
        minMax.bookmarks.min = Math.min(minMax.bookmarks.min, m.bookmarks);
        minMax.bookmarks.max = Math.max(minMax.bookmarks.max, m.bookmarks);
        minMax.ratings.min = Math.min(minMax.ratings.min, m.ratings);
        minMax.ratings.max = Math.max(minMax.ratings.max, m.ratings);
        minMax.comments.min = Math.min(minMax.comments.min, m.comments);
        minMax.comments.max = Math.max(minMax.comments.max, m.comments);
    });

    // Normalize each metric using min-max formula
    const normalize = (value: number, min: number, max: number): number => {
        if (min === max) return 0.5; // All values identical, return middle value
        return (value - min) / (max - min);
    };

    // Second pass: normalize all metrics
    return metrics.map((m) => ({
        ...m,
        normalizedViews: normalize(m.views, minMax.views.min, minMax.views.max),
        normalizedBookmarks: normalize(
            m.bookmarks,
            minMax.bookmarks.min,
            minMax.bookmarks.max,
        ),
        normalizedRatings: normalize(
            m.ratings,
            minMax.ratings.min,
            minMax.ratings.max,
        ),
        normalizedComments: normalize(
            m.comments,
            minMax.comments.min,
            minMax.comments.max,
        ),
    }));
}

/**
 * Calculate weighted trending score
 * Formula: (views × 0.4) + (bookmarks × 0.3) + (ratings × 0.2) + (comments × 0.1)
 * @param normalized - Normalized metrics
 * @returns Trending score (0-1)
 */
function calculateScore(normalized: NormalizedMetrics): number {
    return (
        normalized.normalizedViews * 0.4 +
        normalized.normalizedBookmarks * 0.3 +
        normalized.normalizedRatings * 0.2 +
        normalized.normalizedComments * 0.1
    );
}

/**
 * Fetch manga details for given IDs
 * Handles missing/deleted manga gracefully
 * @param mangaIds - Array of manga IDs to fetch
 * @returns Map of manga ID to manga details
 */
async function fetchMangaDetails(
    mangaIds: string[],
): Promise<
    Map<
        string,
        { id: string; title: string; slug: string; coverUrl: string | null }
    >
> {
    if (mangaIds.length === 0) {
        return new Map();
    }

    const mangaDetails = await db
        .select({
            id: manga.id,
            title: manga.title,
            slug: manga.slug,
            coverUrl: manga.coverUrl,
        })
        .from(manga)
        .where(inArray(manga.id, mangaIds));

    return new Map(mangaDetails.map((m) => [m.id, m]));
}

/**
 * Combine scores with manga details and handle missing manga
 * Logs warnings for orphaned metrics (deleted manga with existing metrics)
 * @param scores - Calculated scores for manga
 * @param mangaMap - Map of manga details
 * @returns Array of trending scores with valid manga details
 */
function combineScoresWithMangaDetails(
    scores: Array<{ mangaId: string; score: number; metrics: TrendingMetrics }>,
    mangaMap: Map<
        string,
        { id: string; title: string; slug: string; coverUrl: string | null }
    >,
): TrendingScore[] {
    const validResults: TrendingScore[] = [];
    const orphanedMetrics: string[] = [];

    scores.forEach((s) => {
        const m = mangaMap.get(s.mangaId);

        if (!m) {
            // Track orphaned metrics for logging
            orphanedMetrics.push(s.mangaId);
            return;
        }

        validResults.push({
            mangaId: s.mangaId,
            title: m.title,
            slug: m.slug,
            coverUrl: m.coverUrl,
            score: s.score * 100, // Scale to 0-100
            rank: 0, // Will be set after filtering
            metrics: s.metrics,
        });
    });

    // Log orphaned metrics for monitoring
    if (orphanedMetrics.length > 0) {
        console.warn(
            `[Trending] Found ${orphanedMetrics.length} orphaned metrics for deleted manga:`,
            orphanedMetrics,
        );
    }

    return validResults;
}

/**
 * Assign ranks to trending scores
 * Ensures sequential ranking without gaps
 * @param results - Trending scores to rank
 * @returns Ranked trending scores
 */
function assignRanks(results: TrendingScore[]): TrendingScore[] {
    return results.map((r, index) => ({
        ...r,
        rank: index + 1,
    }));
}

/**
 * Calculate trending scores for all manga in a time period
 * Handles deleted manga gracefully and ensures correct ranking
 * @param period - Time period to calculate for
 * @returns Sorted array of trending scores with proper ranking
 */
async function calculateTrendingForPeriod(
    period: TimePeriod,
): Promise<TrendingScore[]> {
    // Fetch metrics from database
    const metrics = await fetchMetricsForPeriod(period);

    if (metrics.length === 0) {
        return [];
    }

    // Normalize metrics for fair weighting
    const normalized = normalizeMetrics(metrics);

    // Calculate scores
    const scores = normalized.map((n) => ({
        mangaId: n.mangaId,
        score: calculateScore(n),
        metrics: {
            mangaId: n.mangaId,
            views: n.views,
            bookmarks: n.bookmarks,
            ratings: n.ratings,
            comments: n.comments,
        },
    }));

    // Sort by score descending
    scores.sort((a, b) => b.score - a.score);

    // Fetch manga details for all scored manga
    const mangaIds = scores.map((s) => s.mangaId);
    const mangaMap = await fetchMangaDetails(mangaIds);

    // Combine scores with manga details, filtering out deleted manga
    const validResults = combineScoresWithMangaDetails(scores, mangaMap);

    // Assign sequential ranks to ensure no gaps
    const rankedResults = assignRanks(validResults);

    return rankedResults;
}

/**
 * Validate pagination parameters
 * @param limit - Results per page
 * @param offset - Starting position
 * @throws Error if parameters are invalid
 */
function validatePaginationParams(limit: number, offset: number): void {
    if (limit < 1 || limit > 50) {
        throw new Error("Limit must be between 1 and 50");
    }
    if (offset < 0) {
        throw new Error("Offset must be >= 0");
    }
}

/**
 * Validate time period parameter
 * @param period - Time period to validate
 * @throws Error if period is invalid
 */
function validateTimePeriod(period: string): asserts period is TimePeriod {
    if (!["1d", "7d", "30d"].includes(period)) {
        throw new Error("Invalid period. Must be 1d, 7d, or 30d");
    }
}

/**
 * Get trending manga with Redis caching
 * Implements cache-aside pattern for optimal performance
 * @param period - Time period
 * @param limit - Results per page
 * @param offset - Starting position
 * @returns Trending results with accurate pagination and total count
 */
async function getTrendingManga(
    period: string,
    limit: number,
    offset: number,
): Promise<TrendingResult> {
    // Validate parameters
    validateTimePeriod(period);
    validatePaginationParams(limit, offset);

    // Try to get from cache first (cache-aside pattern)
    const cachedResult = await cacheManager.getTrendingResult(
        period as TimePeriod,
        limit,
        offset,
    );
    if (cachedResult) {
        console.log(
            `[Trending] Cache hit for period=${period}, limit=${limit}, offset=${offset}`,
        );
        return cachedResult;
    }

    console.log(
        `[Trending] Cache miss for period=${period}, limit=${limit}, offset=${offset}. Computing...`,
    );

    // Calculate trending (includes filtering of deleted manga)
    const results = await calculateTrendingForPeriod(period as TimePeriod);

    // Validate offset doesn't exceed available results
    if (offset >= results.length && results.length > 0) {
        console.warn(
            `[Trending] Offset ${offset} exceeds available results (${results.length}). Returning empty page.`,
        );
    }

    // Apply pagination
    const paginatedResults = results.slice(offset, offset + limit);

    // Adjust ranks to account for offset (e.g., page 2 should start at rank 25, not 1)
    const adjustedResults = paginatedResults.map((r, index) => ({
        ...r,
        rank: offset + index + 1,
    }));

    const generatedAt = new Date();
    const expiresAt = new Date(
        generatedAt.getTime() + CACHE_CONFIG.TRENDING_TTL * 1000,
    );

    const result: TrendingResult = {
        period: period as TimePeriod,
        limit,
        offset,
        total: results.length, // Reflects actual count after filtering deleted manga
        manga: adjustedResults.map((r) => ({
            id: r.mangaId,
            title: r.title,
            slug: r.slug,
            coverUrl: r.coverUrl,
            score: r.score,
            rank: r.rank,
            metrics: r.metrics,
        })),
        generatedAt: generatedAt.toISOString(),
        expiresAt: expiresAt.toISOString(),
    };

    // Cache the result asynchronously (non-blocking)
    cacheManager
        .setTrendingResult(period as TimePeriod, limit, offset, result)
        .catch((error) => {
            console.error("[Trending] Failed to cache result:", error);
        });

    return result;
}

export {
    getTrendingManga,
    calculateTrendingForPeriod,
    fetchMetricsForPeriod,
    normalizeMetrics,
    calculateScore,
    getTimeWindowStart,
    validatePaginationParams,
    validateTimePeriod,
    cacheManager,
    type TrendingResult,
    type TrendingMetrics,
    type TimePeriod,
};
