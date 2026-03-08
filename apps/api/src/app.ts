import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { errorHandler } from "./middleware/error-handler.js";
import { mangaRoutes } from "./routes/manga.routes.js";
import { chapterRoutes } from "./routes/chapter.routes.js";
import { authRoutes } from "./routes/auth.routes.js";
import { uploadRoutes } from "./routes/upload.routes.js";

export const app = new Hono();

// Global middleware
app.use("*", logger());
app.use("*", prettyJSON());
app.use(
    "*",
    cors({
        origin: [
            "http://localhost:4321",
            "http://localhost:3000",
            "https://mangaden.rejwanul.dev",
        ],
        credentials: true,
    }),
);

// Error handling
app.onError(errorHandler);

// Health check
app.get("/", (c) => {
    return c.json({
        success: true,
        message: "MangaDen API is running!",
        version: "1.0.0",
    });
});

app.get("/health", (c) => {
    return c.json({
        success: true,
        status: "healthy",
        timestamp: new Date().toISOString(),
    });
});

// API Routes
app.route("/api/manga", mangaRoutes);
app.route("/api/chapters", chapterRoutes);
app.route("/api/auth", authRoutes);
app.route("/api/upload", uploadRoutes);

// 404 handler
app.notFound((c) => {
    return c.json(
        {
            success: false,
            error: "Not Found",
            message: `Route ${c.req.path} not found`,
        },
        404,
    );
});
