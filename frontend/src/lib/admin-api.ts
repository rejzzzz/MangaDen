import type { ApiResponse, Manga, Chapter } from "@mangaden/shared/types";

const API_BASE = import.meta.env.PUBLIC_API_URL || "http://localhost:3000";
const API_URL = API_BASE.endsWith("/api") ? API_BASE : `${API_BASE}/api`;

/**
 * Helper to ensure credentials and JSON headers are sent with requests.
 */
async function fetchAdmin<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
        const res = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            // Include credentials so cookies (like HttpOnly JWTs) are sent
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
                ...options.headers,
            },
        });

        const data = await res.json();

        if (!res.ok) {
            return {
                success: false,
                error: data.error || "Request failed",
                message: data.message || "An unexpected error occurred.",
            };
        }

        return data as ApiResponse<T>;
    } catch (err: any) {
        return {
            success: false,
            error: "Network Error",
            message: err.message || "Failed to communicate with the backend.",
        };
    }
}

/**
 * Dedicated API client for admin mutations.
 * Strictly typed using @mangaden/shared payloads.
 */
export const adminApi = {
    // ---- Manga Mutations ----

    /**
     * Creates a new manga entry in the database.
     */
    async createManga(payload: Partial<Manga>): Promise<ApiResponse<Manga>> {
        return fetchAdmin<Manga>("/manga", {
            method: "POST",
            body: JSON.stringify(payload),
        });
    },

    /**
     * Updates an existing manga entry.
     */
    async updateManga(id: string, payload: Partial<Manga>): Promise<ApiResponse<Manga>> {
        return fetchAdmin<Manga>(`/manga/${id}`, {
            method: "PATCH",
            body: JSON.stringify(payload),
        });
    },

    /**
     * Deletes a manga and cascade-deletes all its chapters/pages/views.
     */
    async deleteManga(id: string): Promise<ApiResponse<null>> {
        return fetchAdmin<null>(`/manga/${id}`, {
            method: "DELETE",
        });
    },

    // ---- Chapter Mutations ----

    /**
     * Uploads a cover image for a manga.
     */
    async uploadCover(file: File): Promise<ApiResponse<{ url: string }>> {
        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch(`${API_URL}/manga/upload-cover`, {
                method: "POST",
                credentials: "include",
                body: formData,
            });
            const data = await res.json();
            if (!res.ok) {
                return { success: false, error: data.error, message: data.message };
            }
            return data as ApiResponse<{ url: string }>;
        } catch (err: any) {
            return { success: false, error: "Upload Failed", message: err.message };
        }
    },

    /**
     * Creates a new chapter for a specific manga.
     */
    async createChapter(mangaId: string, payload: Partial<Chapter>): Promise<ApiResponse<Chapter>> {
        return fetchAdmin<Chapter>(`/chapters`, {
            method: "POST",
            body: JSON.stringify({ ...payload, mangaId }),
        });
    },

    /**
     * Deletes a chapter and cascade-deletes all its pages.
     */
    async deleteChapter(id: string): Promise<ApiResponse<null>> {
        return fetchAdmin<null>(`/chapters/${id}`, {
            method: "DELETE",
        });
    },

    // ---- Page/Upload Mutations ----

    /**
     * Uploads a PDF to extract pages to a specific chapter.
     * Uses FormData, so it overrides the Content-Type header.
     */
    async uploadPdfPages(chapterId: string, file: File): Promise<ApiResponse<{ jobId: string }>> {
        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch(`${API_URL}/pages/chapters/${chapterId}/pdf`, {
                method: "POST",
                credentials: "include",
                // Do not explicitly set Content-Type to application/json so the browser
                // automatically sets the multipart/form-data boundary
                body: formData,
            });
            const data = await res.json();
            if (!res.ok) {
                return { success: false, error: data.error, message: data.message };
            }
            return data as ApiResponse<{ jobId: string }>;
        } catch (err: any) {
            return { success: false, error: "Upload Failed", message: err.message };
        }
    },

    async getUploadJobStatus(jobId: string): Promise<ApiResponse<any>> {
        return fetchAdmin<any>(`/pages/job/${jobId}`);
    },

    async deletePage(id: string): Promise<ApiResponse<null>> {
        return fetchAdmin<null>(`/pages/${id}`, {
            method: "DELETE",
        });
    }
};
