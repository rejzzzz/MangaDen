import { Hono } from "hono";
import { auth } from "../lib/auth.js";

export const authRoutes = new Hono();

// Mount Better Auth routes - handles /sign-in, /sign-up, /sign-out, etc.
authRoutes.on(["POST", "GET"], "/*", (c) => auth.handler(c.req.raw));
