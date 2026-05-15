import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { supabaseAdmin } from "../lib/supabase-auth.js";
import { db } from "../db/index.js";
import { users } from "../db/schema/index.js";
import { eq } from "drizzle-orm";

export const authRoutes = new Hono();

const signUpSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    username: z.string().min(3).max(50),
});

const signInSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});

// Helper to set secure cookies
function setAuthCookies(c: any, accessToken: string, refreshToken: string) {
    const oneDay = 24 * 60 * 60; // 1 day in seconds
    const sevenDays = 7 * 24 * 60 * 60; // 7 days in seconds

    c.header("Set-Cookie", [
        `access_token=${accessToken}; Max-Age=${oneDay}; Path=/; HttpOnly; Secure; SameSite=Strict`,
        `refresh_token=${refreshToken}; Max-Age=${sevenDays}; Path=/; HttpOnly; Secure; SameSite=Strict`,
    ]);
}

// POST /api/auth/sign-up
authRoutes.post("/sign-up", zValidator("json", signUpSchema), async (c) => {
    const { email, password, username } = c.req.valid("json");

    try {
        // Check if user already exists in our database
        const existingUser = await db.query.users.findFirst({
            where: eq(users.email, email),
        });

        if (existingUser) {
            return c.json(
                {
                    success: false,
                    error: "User already exists",
                    message: "Email is already registered",
                },
                409,
            );
        }

        // Create user in Supabase Auth
        const { data: authData, error: authError } =
            await supabaseAdmin.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
            });

        if (authError || !authData.user) {
            return c.json(
                {
                    success: false,
                    error: "Sign up failed",
                    message: authError?.message || "Failed to create user",
                },
                400,
            );
        }

        // Create user profile in database
        const [userProfile] = await db
            .insert(users)
            .values({
                id: authData.user.id,
                email,
                username,
                passwordHash: "", // Not used with Supabase Auth
                isAdmin: false,
            })
            .returning();

        // Generate session token
        const { data: sessionData, error: sessionError } =
            await supabaseAdmin.auth.admin.createSession(authData.user.id);

        if (sessionError || !sessionData.session) {
            return c.json(
                {
                    success: false,
                    error: "Session creation failed",
                    message:
                        sessionError?.message || "Failed to create session",
                },
                400,
            );
        }

        // Set secure HttpOnly cookies
        setAuthCookies(
            c,
            sessionData.session.access_token,
            sessionData.session.refresh_token,
        );

        return c.json(
            {
                success: true,
                data: {
                    user: userProfile,
                    session: {
                        access_token: sessionData.session.access_token,
                        refresh_token: sessionData.session.refresh_token,
                        expires_in: sessionData.session.expires_in,
                        expires_at: sessionData.session.expires_at,
                    },
                },
            },
            201,
        );
    } catch (error) {
        console.error("Sign up error:", error);
        return c.json(
            {
                success: false,
                error: "Internal server error",
                message: "An unexpected error occurred",
            },
            500,
        );
    }
});

// POST /api/auth/sign-in
authRoutes.post("/sign-in", zValidator("json", signInSchema), async (c) => {
    const { email, password } = c.req.valid("json");

    try {
        // Authenticate with Supabase
        const { data, error } =
            await supabaseAdmin.auth.admin.signInWithPassword(email, password);

        if (error || !data.session) {
            return c.json(
                {
                    success: false,
                    error: "Authentication failed",
                    message: error?.message || "Invalid credentials",
                },
                401,
            );
        }

        // Get user profile from database
        const userProfile = await db.query.users.findFirst({
            where: eq(users.id, data.user.id),
        });

        if (!userProfile) {
            return c.json(
                {
                    success: false,
                    error: "User profile not found",
                    message: "User exists in auth but not in database",
                },
                404,
            );
        }

        // Set secure HttpOnly cookies
        setAuthCookies(
            c,
            data.session.access_token,
            data.session.refresh_token,
        );

        return c.json({
            success: true,
            data: {
                user: userProfile,
                session: {
                    access_token: data.session.access_token,
                    refresh_token: data.session.refresh_token,
                    expires_in: data.session.expires_in,
                    expires_at: data.session.expires_at,
                },
            },
        });
    } catch (error) {
        console.error("Sign in error:", error);
        return c.json(
            {
                success: false,
                error: "Internal server error",
                message: "An unexpected error occurred",
            },
            500,
        );
    }
});

// POST /api/auth/refresh
authRoutes.post("/refresh", async (c) => {
    const { refresh_token } = await c.req.json();

    if (!refresh_token) {
        return c.json(
            {
                success: false,
                error: "Missing refresh token",
            },
            400,
        );
    }

    try {
        const { data, error } = await supabaseAdmin.auth.refreshSession({
            refresh_token,
        });

        if (error || !data.session) {
            return c.json(
                {
                    success: false,
                    error: "Token refresh failed",
                    message: error?.message || "Invalid refresh token",
                },
                401,
            );
        }

        // Set new secure HttpOnly cookies
        setAuthCookies(
            c,
            data.session.access_token,
            data.session.refresh_token,
        );

        return c.json({
            success: true,
            data: {
                session: {
                    access_token: data.session.access_token,
                    refresh_token: data.session.refresh_token,
                    expires_in: data.session.expires_in,
                    expires_at: data.session.expires_at,
                },
            },
        });
    } catch (error) {
        console.error("Token refresh error:", error);
        return c.json(
            {
                success: false,
                error: "Internal server error",
            },
            500,
        );
    }
});

// POST /api/auth/sign-out
authRoutes.post("/sign-out", async (c) => {
    // Clear cookies by setting Max-Age to 0
    c.header("Set-Cookie", [
        "access_token=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Strict",
        "refresh_token=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Strict",
    ]);

    return c.json({
        success: true,
        message: "Signed out successfully",
    });
});
