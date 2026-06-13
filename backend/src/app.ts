import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { errorHandler } from "./middleware/error-handler.js";
import { mangaRoutes } from "./routes/manga.routes.js";
import { chapterRoutes } from "./routes/chapter.routes.js";
import { authRoutes } from "./routes/auth.routes.js";
import { uploadRoutes } from "./routes/upload.routes.js";
import { pagesRoutes } from "./routes/pages.routes.js";
import { userRoutes } from "./routes/user.routes.js";
import { trendingRoutes } from "./routes/trending.routes.js";

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
            "https://manga-den-frontend.vercel.app",
            "https://vm-manga-reader-frontend.vusercontent.net",
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
        ok: true,
    });
});

// API Routes
app.route("/api/manga", mangaRoutes);
app.route("/api/chapters", chapterRoutes);
app.route("/api/auth", authRoutes);
app.route("/api/upload", uploadRoutes);
app.route("/api/pages", pagesRoutes);
app.route("/api/user", userRoutes);
app.route("/api/trending", trendingRoutes);

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
