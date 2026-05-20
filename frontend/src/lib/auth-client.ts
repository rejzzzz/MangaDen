const API_BASE = import.meta.env.PUBLIC_API_URL || "http://localhost:3000";

export interface AuthUser {
    id: string;
    email: string;
    username: string;
    avatarUrl?: string | null;
    isAdmin: boolean;
}

export async function signUp(email: string, password: string, username: string) {
    try {
        const response = await fetch(`${API_BASE}/api/auth/sign-up`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ email, password, username }),
        });

        const data = await response.json();
        if (!response.ok) {
            return { error: { message: data.message || "Sign up failed" } };
        }
        return { data };
    } catch (error: any) {
        return { error: { message: error.message || "Network error" } };
    }
}

export async function signIn(email: string, password: string) {
    try {
        const response = await fetch(`${API_BASE}/api/auth/sign-in`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();
        if (!response.ok) {
            return { error: { message: data.message || "Sign in failed" } };
        }
        return { data };
    } catch (error: any) {
        return { error: { message: error.message || "Network error" } };
    }
}

export async function signOut() {
    try {
        await fetch(`${API_BASE}/api/auth/sign-out`, {
            method: "POST",
            credentials: "include",
        });
    } catch {
        // no-op
    }
    return { data: null };
}

export async function getCurrentUser(): Promise<AuthUser | null> {
    try {
        const response = await fetch(`${API_BASE}/api/auth/me`, {
            method: "GET",
            credentials: "include",
        });
        if (!response.ok) return null;
        const data = await response.json();
        return data?.data?.user ?? null;
    } catch {
        return null;
    }
}
