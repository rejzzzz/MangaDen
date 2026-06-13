import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema/index.js";
import "dotenv/config";

const connectionString = process.env.DB_DIRECT_POOLER_URL || process.env.DATABASE_URL!;

// For query purposes
const queryClient = postgres(connectionString, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
});
export const db = drizzle(queryClient, { schema });

// Export schema for external use
export { schema };
