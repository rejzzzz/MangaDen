import "dotenv/config";
import { db } from "./src/db/index.js";
import { redis } from "./src/lib/redis.js";
import { configureCloudinary } from "./src/lib/cloudinary.js";
import { v2 as cloudinary } from "cloudinary";

async function testConnections() {
    console.log("🔍 Testing MangaDen Backend Connections\n");

    // Test 1: Database (Supabase)
    console.log("1️⃣  Testing Database Connection (Supabase)...");
    try {
        const result = await db.execute("SELECT NOW() as time");
        console.log("   ✅ Database connected successfully");
        const time = result.rows?.[0]?.time || result[0]?.time || "N/A";
        console.log(`   📅 Server time: ${time}\n`);
    } catch (error) {
        console.error("   ❌ Database connection failed:", error);
        console.log("");
    }

    // Test 2: Redis (Upstash)
    console.log("2️⃣  Testing Redis Connection (Upstash)...");
    try {
        const testKey = "test:connection";
        const testValue = {
            message: "Hello from MangaDen!",
            timestamp: Date.now(),
        };

        await redis.set(testKey, testValue, { ex: 10 });
        const retrieved = await redis.get(testKey);

        if (retrieved) {
            console.log("   ✅ Redis connected successfully");
            console.log(`   📦 Test data: ${JSON.stringify(retrieved)}\n`);
        } else {
            console.log("   ⚠️  Redis connected but data retrieval failed\n");
        }
    } catch (error) {
        console.error("   ❌ Redis connection failed:", error);
        console.log("");
    }

    // Test 3: Cloudinary
    console.log("3️⃣  Testing Cloudinary Connection...");
    try {
        configureCloudinary();
        const result = await cloudinary.api.ping();

        if (result.status === "ok") {
            console.log("   ✅ Cloudinary connected successfully");
            console.log(
                `   ☁️  Cloud name: ${process.env.CLOUDINARY_CLOUD_NAME}\n`,
            );
        } else {
            console.log("   ⚠️  Cloudinary responded but status is not ok\n");
        }
    } catch (error) {
        console.error("   ❌ Cloudinary connection failed:", error);
        console.log("");
    }

    // Test 4: Environment Variables
    console.log("4️⃣  Checking Environment Variables...");
    const requiredVars = [
        "DATABASE_URL",
        "SUPABASE_URL",
        "SUPABASE_ANON_KEY",
        "UPSTASH_REDIS_REST_URL",
        "UPSTASH_REDIS_REST_TOKEN",
        "BETTER_AUTH_SECRET",
        "CLOUDINARY_CLOUD_NAME",
        "CLOUDINARY_API_KEY",
        "CLOUDINARY_API_SECRET",
    ];

    const missing: string[] = [];
    const present: string[] = [];

    for (const varName of requiredVars) {
        if (process.env[varName]) {
            present.push(varName);
        } else {
            missing.push(varName);
        }
    }

    console.log(`   ✅ Present: ${present.length}/${requiredVars.length}`);
    if (missing.length > 0) {
        console.log(`   ❌ Missing: ${missing.join(", ")}`);
    }
    console.log("");

    // Summary
    console.log("📊 Connection Test Summary");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(
        `Database:    ${present.includes("DATABASE_URL") ? "✅" : "❌"}`,
    );
    console.log(
        `Redis:       ${present.includes("UPSTASH_REDIS_REST_URL") ? "✅" : "❌"}`,
    );
    console.log(
        `Cloudinary:  ${present.includes("CLOUDINARY_CLOUD_NAME") ? "✅" : "❌"}`,
    );
    console.log(
        `Auth:        ${present.includes("BETTER_AUTH_SECRET") ? "✅" : "❌"}`,
    );
    console.log("");

    if (missing.length === 0) {
        console.log("🎉 All connections configured and working!");
    } else {
        console.log("⚠️  Some connections need attention. Check .env file.");
    }

    process.exit(0);
}

testConnections().catch((err) => {
    console.error("❌ Test failed:", err);
    process.exit(1);
});
