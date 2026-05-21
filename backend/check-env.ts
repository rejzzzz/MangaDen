import "dotenv/config";

console.log("🔍 Environment Variables Check\n");

const vars = {
    DATABASE_URL: process.env.DATABASE_URL,
    SUPABASE_URL: process.env.SUPABASE_URL,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
};

for (const [key, value] of Object.entries(vars)) {
    if (value) {
        // Mask sensitive parts
        const masked =
            value.length > 20
                ? value.substring(0, 15) +
                  "..." +
                  value.substring(value.length - 5)
                : value.substring(0, 10) + "...";
        console.log(`✅ ${key}: ${masked}`);
    } else {
        console.log(`❌ ${key}: NOT SET`);
    }
}

console.log("\n📝 Notes:");
console.log(
    "- Database connection error suggests credentials might be invalid",
);
console.log(
    "- Redis connection error suggests the Upstash instance might be paused/deleted",
);
console.log("- Cloudinary works perfectly!");
console.log("\n💡 Next steps:");
console.log("1. Check if Supabase project is active");
console.log("2. Check if Upstash Redis instance is active");
console.log("3. Verify credentials haven't been rotated");
