import { createClient } from "@supabase/supabase-js";
import { jwtVerify } from "jose";

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const jwtSecret = process.env.SUPABASE_JWT_SECRET || "";

// Admin client (for server-side operations)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

// Anon client (for client-side operations)
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// JWT verification for token validation
export async function verifySupabaseToken(token: string) {
    try {
        if (!jwtSecret) {
            throw new Error("SUPABASE_JWT_SECRET not configured");
        }

        const secret = new TextEncoder().encode(jwtSecret);
        const verified = await jwtVerify(token, secret);
        return verified.payload;
    } catch (error) {
        console.error("Token verification failed:", error);
        return null;
    }
}

// Extract token from Authorization header
export function extractToken(authHeader: string | null): string | null {
    if (!authHeader) return null;
    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") return null;
    return parts[1];
}

// Get user from token
export async function getUserFromToken(token: string) {
    const payload = await verifySupabaseToken(token);
    if (!payload) return null;

    return {
        id: payload.sub,
        email: payload.email,
        aud: payload.aud,
    };
}
