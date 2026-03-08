import { Context, Next } from "hono";
import { auth } from "../lib/auth.js";

export async function authMiddleware(c: Context, next: Next) {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });

    if (!session) {
        return c.json(
            {
                success: false,
                error: "Unauthorized",
                message: "No valid session",
            },
            401,
        );
    }

    c.set("user", session.user);
    c.set("session", session.session);
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
