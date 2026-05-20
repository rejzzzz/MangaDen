import { Context, Next } from "hono";
import { extractToken, getUserFromToken } from "../lib/supabase-auth.js";
import { db } from "../db/index.js";
import { users } from "../db/schema/index.js";
import { eq } from "drizzle-orm";
import { getCookie } from "hono/cookie";

export async function authMiddleware(c: Context, next: Next) {
    // Try to get token from Authorization header first (for API clients)
    let authHeader = c.req.header("Authorization");
    let token = extractToken(authHeader);

    // If not in header, try to get from cookies
    if (!token) {
        token = getCookie(c, "access_token") || null;
    }

    if (!token) {
        return c.json(
            {
                success: false,
                error: "Unauthorized",
                message: "No valid token provided",
            },
            401,
        );
    }

    const user = await getUserFromToken(token);

    if (!user) {
        return c.json(
            {
                success: false,
                error: "Unauthorized",
                message: "Invalid or expired token",
            },
            401,
        );
    }

    // Get user profile from database
    const userProfile = await db.query.users.findFirst({
        where: eq(users.id, user.id),
    });

    if (!userProfile) {
        return c.json(
            {
                success: false,
                error: "Unauthorized",
                message: "User profile not found",
            },
            401,
        );
    }

    c.set("user", userProfile);
    c.set("token", token);
    await next();
}

export async function adminMiddleware(c: Context, next: Next) {
    const user = c.get("user");

    if (!user || !user.isAdmin) {
        return c.json(
            {
                success: false,
                error: "Forbidden",
                message: "Admin access required",
            },
            403,
        );
    }

    await next();
}
