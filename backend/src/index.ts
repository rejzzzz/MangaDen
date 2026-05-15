import { serve } from "@hono/node-server";
import { app } from "./app.js";
import "dotenv/config";

const port = Number(process.env.PORT) || 3000;

console.log(`🚀 MangaDen API starting on port ${port}`);

serve({
    fetch: app.fetch,
    port,
});

console.log(`✅ Server running at http://localhost:${port}`);
