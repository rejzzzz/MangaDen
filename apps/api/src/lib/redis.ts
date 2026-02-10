import { Redis } from "@upstash/redis";
import "dotenv/config";

// Use Upstash Redis HTTP client - perfect for Vercel/Serverless
// It requires UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in .env
// If not provided, it will try to use local redis if you configure a local proxy, 
// but for simplicity, we assume Upstash credentials are provided.

const getRedisConfig = () => {
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
        return {
            url: process.env.UPSTASH_REDIS_REST_URL,
            token: process.env.UPSTASH_REDIS_REST_TOKEN,
        };
    }
    // Fallback or error - simplistic local fallback for dev if needed, 
    // but better to enforce Upstash for consistency with prod.
    // However, the user might want to run local redis. 
    // @upstash/redis doesn't support local TCP redis directly.
    console.warn("⚠️  UPSTASH_REDIS_REST_URL is missing. Cache will not work.");
    return { url: "http://localhost:8079", token: "example_token" }; // Dummy
};

export const redis = new Redis(getRedisConfig());

// Cache helper functions
export const cache = {
    async get<T>(key: string): Promise<T | null> {
        try {
            // Redis returns the object directly if stored as JSON with Upstash, 
            // or we might need to cast/parse depending on how we store it.
            // With upstash/redis, it automatically parses JSON if it detects it.
            const data = await redis.get<T>(key);
            return data;
        } catch (error) {
            console.error(`Cache GET error for key ${key}:`, error);
            return null;
        }
    },

    async set(key: string, value: unknown, ttlSeconds = 300): Promise<void> {
        try {
            // Upstash/Redis handles object serialization automatically if passed as object
            await redis.set(key, value, { ex: ttlSeconds });
        } catch (error) {
            console.error(`Cache SET error for key ${key}:`, error);
        }
    },

    async del(key: string): Promise<void> {
        try {
            await redis.del(key);
        } catch (error) {
            console.error(`Cache DEL error for key ${key}:`, error);
        }
    },

    async delPattern(pattern: string): Promise<void> {
        try {
            const keys = await redis.keys(pattern);
            if (keys.length > 0) {
                await redis.del(...keys);
            }
        } catch (error) {
            console.error(`Cache DEL_PATTERN error for pattern ${pattern}:`, error);
        }
    },
};
