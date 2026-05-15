// Cookie helper functions
function setCookie(name: string, value: string, days: number = 7) {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    const expires = `expires=${date.toUTCString()}`;
    document.cookie = `${name}=${encodeURIComponent(value)}; ${expires}; path=/; SameSite=Strict`;
}

function getCookie(name: string): string | null {
    const nameEQ = `${name}=`;
    const cookies = document.cookie.split(";");
    for (let cookie of cookies) {
        cookie = cookie.trim();
        if (cookie.startsWith(nameEQ)) {
            return decodeURIComponent(cookie.substring(nameEQ.length));
        }
    }
    return null;
}

function deleteCookie(name: string) {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

// Auth helper functions
export async function signUp(
    email: string,
    password: string,
    username: string,
) {
    try {
        const response = await fetch(
            `${import.meta.env.PUBLIC_API_URL}/api/auth/sign-up`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({ email, password, username }),
            },
        );

        const data = await response.json();

        if (!response.ok) {
            return {
                error: {
                    message: data.message || "Sign up failed",
                },
            };
        }

        // Store tokens in cookies (HttpOnly handled by backend)
        if (data.data?.session?.access_token) {
            setCookie("access_token", data.data.session.access_token, 1); // 1 day
            setCookie("refresh_token", data.data.session.refresh_token, 7); // 7 days
            setCookie("user", JSON.stringify(data.data.user), 7);
        }

        return { data };
    } catch (error: any) {
        return {
            error: {
                message: error.message || "Network error",
            },
        };
    }
}

export async function signIn(email: string, password: string) {
    try {
        const response = await fetch(
            `${import.meta.env.PUBLIC_API_URL}/api/auth/sign-in`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({ email, password }),
            },
        );

        const data = await response.json();

        if (!response.ok) {
            return {
                error: {
                    message: data.message || "Sign in failed",
                },
            };
        }

        // Store tokens in cookies
        if (data.data?.session?.access_token) {
            setCookie("access_token", data.data.session.access_token, 1); // 1 day
            setCookie("refresh_token", data.data.session.refresh_token, 7); // 7 days
            setCookie("user", JSON.stringify(data.data.user), 7);
        }

        return { data };
    } catch (error: any) {
        return {
            error: {
                message: error.message || "Network error",
            },
        };
    }
}

export async function signOut() {
    // Clear tokens from cookies
    deleteCookie("access_token");
    deleteCookie("refresh_token");
    deleteCookie("user");

    return { data: null };
}

export function getAccessToken(): string | null {
    return getCookie("access_token");
}

export function getUser() {
    const userStr = getCookie("user");
    return userStr ? JSON.parse(userStr) : null;
}

export function isAuthenticated(): boolean {
    return !!getAccessToken();
}
