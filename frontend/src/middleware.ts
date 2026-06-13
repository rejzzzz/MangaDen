import { defineMiddleware } from "astro:middleware";
import type { AuthUser } from "./lib/auth-client";

// Retrieve the base URL securely for server-side fetches.
const API_BASE = import.meta.env.PUBLIC_API_URL || "http://localhost:3000";

/**
 * Centralized Security Guard (Astro Middleware).
 * Intercepts every request to verify authentication and role-based access control.
 * Ensures the 'user' object is safely injected into 'context.locals' for downstream Astro components.
 */
export const onRequest = defineMiddleware(async (context, next) => {
    // By default, assume no user is logged in
    context.locals.user = null;

    // We only strictly guard /admin routes here to keep public pages fast,
    // though you could expand this to fetch the user globally if needed.
    if (context.url.pathname.startsWith("/admin")) {
        const accessToken = context.cookies.get("access_token")?.value;

        // Fail loudly: If there is no token, boot them out immediately.
        if (!accessToken) {
            return context.redirect("/?login=true");
        }

        try {
            // Verify the token securely with the backend
            const response = await fetch(`${API_BASE}/api/auth/me`, {
                method: "GET",
                headers: {
                    // Manually forward the cookie since this is a server-side node-fetch
                    Cookie: `access_token=${accessToken}`,
                },
            });

            if (!response.ok) {
                return context.redirect("/?login=true");
            }

            const data = await response.json();
            const user: AuthUser | null = data?.data?.user || null;

            // RBAC Check: Ensure the user is an admin or moderator
            if (!user || (user.role !== "admin" && user.role !== "moderator")) {
                console.warn(`[Security] Blocked unauthorized access attempt to ${context.url.pathname} by user: ${user?.email || 'Unknown'}`);
                return context.redirect("/"); // Redirect unauthorized users to home (no modal needed, just rejected)
            }

            // Successfully authenticated and authorized
            context.locals.user = user;
        } catch (err) {
            console.error("[Security] Middleware auth check failed:", err);
            return context.redirect("/?login=true");
        }
    }

    return next();
});
