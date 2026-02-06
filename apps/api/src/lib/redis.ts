import Redis from "ioredis";
import "dotenv/config";

export const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

redis.on("connect", () => {
    console.log("✅ Redis connected");
});

redis.on("error", (err) => {
    console.error("❌ Redis error:", err);
});

// Cache helper functions
export const cache = {
    async get<T>(key: string): Promise<T | null> {
        const data = await redis.get(key);
        return data ? JSON.parse(data) : null;
    },

    async set(key: string, value: unknown, ttlSeconds = 300): Promise<void> {
        await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
    },

    async del(key: string): Promise<void> {
        await redis.del(key);
    },

    async delPattern(pattern: string): Promise<void> {
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
            await redis.del(...keys);
        }
    },
};
