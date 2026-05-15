import { Redis } from "@upstash/redis";
import "dotenv/config";

const getRedisConfig = () => {
    if (
        process.env.UPSTASH_REDIS_REST_URL &&
        process.env.UPSTASH_REDIS_REST_TOKEN
    ) {
        return {
            url: process.env.UPSTASH_REDIS_REST_URL,
            token: process.env.UPSTASH_REDIS_REST_TOKEN,
        };
    }
    console.warn("⚠️  UPSTASH_REDIS_REST_URL is missing. Cache will not work.");
    return { url: "http://localhost:8079", token: "example_token" };
};

export const redis = new Redis(getRedisConfig());

export const cache = {
    async get<T>(key: string): Promise<T | null> {
        try {
            const data = await redis.get<T>(key);
            return data;
        } catch (error) {
            console.error(`Cache GET error for key ${key}:`, error);
            return null;
        }
    },

    async set(key: string, value: unknown, ttlSeconds = 300): Promise<void> {
        try {
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
            console.error(
                `Cache DEL_PATTERN error for pattern ${pattern}:`,
                error,
            );
        }
    },
};
