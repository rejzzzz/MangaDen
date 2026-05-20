/**
 * One-time migration script to create trending engine tables.
 * Run with: npx tsx src/db/run-migration.ts
 */
import postgres from "postgres";
import "dotenv/config";
import { readFileSync } from "fs";
import { join } from "path";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
}

async function runMigration() {
    const sql = postgres(DATABASE_URL!, {
        max: 1,
        connect_timeout: 15,
    });

    try {
        console.log("Connecting to database...");

        // Read the migration SQL
        const migrationPath = join(
            import.meta.dirname ?? __dirname,
            "migrations",
            "0001_complex_runaways.sql",
        );
        const migrationSql = readFileSync(migrationPath, "utf-8");

        // Split on statement breakpoints and execute each statement
        const statements = migrationSql
            .split("--> statement-breakpoint")
            .map((s) => s.trim())
            .filter((s) => s.length > 0);

        console.log(`Found ${statements.length} statements to execute.`);

        for (let i = 0; i < statements.length; i++) {
            const stmt = statements[i];
            try {
                await sql.unsafe(stmt);
                console.log(`  ✅ Statement ${i + 1}/${statements.length} executed.`);
            } catch (err: any) {
                // Skip "already exists" errors gracefully
                if (
                    err.code === "42P07" || // duplicate_table
                    err.code === "42710"    // duplicate_object (constraint)
                ) {
                    console.log(`  ⏭️  Statement ${i + 1}/${statements.length} skipped (already exists).`);
                } else {
                    console.error(`  ❌ Statement ${i + 1}/${statements.length} failed:`, err.message);
                    throw err;
                }
            }
        }

        console.log("\n✅ Migration completed successfully!");
    } catch (error) {
        console.error("\n❌ Migration failed:", error);
        process.exit(1);
    } finally {
        await sql.end();
    }
}

runMigration();
