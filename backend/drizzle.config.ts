import { defineConfig } from "drizzle-kit";
import "dotenv/config";

export default defineConfig({
    schema: "./src/db/schema/index.ts",
    out: "./src/db/migrations",
    dialect: "postgresql",
    dbCredentials: {
        url: process.env.DB_DIRECT_POOLER_URL || process.env.DATABASE_URL!,
    },
    verbose: true,
    strict: true,
});

