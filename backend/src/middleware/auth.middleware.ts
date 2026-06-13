import { Context, Next } from "hono";
import { extractToken, getUserFromToken } from "../lib/supabase-auth.js";
import { db } from "../db/index.js";
import { users } from "../db/schema/index.js";
import { eq } from "drizzle-orm";
import { getCookie } from "hono/cookie";

/**
 * Definition of the global Hono environment for MangaDen API.
 */
export type AppEnv = {
    Variables: {
        user: typeof users.$inferSelect;
        token: string;
    };
};

/**
 * Middleware to authenticate requests using Supabase tokens from header or cookie.
 * Injects the authenticated user profile into the context.
 */
export async function authMiddleware(c: Context<AppEnv>, next: Next) {
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

/**
 * Higher-order middleware function to restrict access based on user roles.
 * Expects the user profile to be injected by authMiddleware.
 */
export function roleMiddleware(allowedRoles: string[]) {
    return async (c: Context<AppEnv>, next: Next) => {
        const user = c.get("user");

        if (!user || !allowedRoles.includes(user.role)) {
            return c.json(
                {
                    success: false,
                    error: "Forbidden",
                    message: "Insufficient permissions",
                },
                403,
            );
        }

        await next();
    };
}

export const adminMiddleware = roleMiddleware(["admin"]);
