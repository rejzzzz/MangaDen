import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

export const authRoutes = new Hono();

// Validation schemas
const registerSchema = z.object({
    email: z.string().email(),
    username: z.string().min(3).max(50),
    password: z.string().min(8),
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});

// POST /api/auth/register
authRoutes.post("/register", zValidator("json", registerSchema), async (c) => {
    const body = c.req.valid("json");

    // TODO: Implement actual registration
    // 1. Hash password with bcrypt/argon2
    // 2. Check if user exists
    // 3. Create user in database
    // 4. Generate JWT token

    return c.json({
        success: true,
        message: "Registration endpoint - TODO: implement",
        data: { email: body.email, username: body.username },
    });
});

// POST /api/auth/login
authRoutes.post("/login", zValidator("json", loginSchema), async (c) => {
    const body = c.req.valid("json");

    // TODO: Implement actual login
    // 1. Find user by email
    // 2. Verify password
    // 3. Generate JWT token

    return c.json({
        success: true,
        message: "Login endpoint - TODO: implement",
    });
});

// GET /api/auth/me - Get current user
authRoutes.get("/me", async (c) => {
    // TODO: Implement with JWT middleware

    return c.json({
        success: true,
        message: "Me endpoint - TODO: implement with auth middleware",
    });
});

// POST /api/auth/logout
authRoutes.post("/logout", async (c) => {
    return c.json({
        success: true,
        message: "Logged out successfully",
    });
});
