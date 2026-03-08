const API_BASE = import.meta.env.PUBLIC_API_URL || "http://localhost:3000";

// Ensure API_BASE ends with /api
const API_URL = API_BASE.endsWith("/api") ? API_BASE : `${API_BASE}/api`;

// Types
export interface Manga {
    id: string;
    title: string;
    slug: string;
    description?: string;
    coverUrl?: string;
    author?: string;
    artist?: string;
    status: "ongoing" | "completed" | "hiatus" | "cancelled";
    type: "manga" | "manhwa" | "manhua" | "webtoon";
    releaseYear?: number;
    viewCount: number;
    createdAt: string;
    updatedAt: string;
}

export interface Chapter {
    id: string;
    mangaId: string;
    number: number;
    title?: string;
    slug: string;
    pageCount: number;
    createdAt: string;
}

export interface Page {
    id: string;
    chapterId: string;
    pageNumber: number;
    imageUrl: string;
    width?: number;
    height?: number;
}

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    cached?: boolean;
    pagination?: {
        page: number;
        limit: number;
    };
}

// API Client
export const api = {
    // Auth helpers
    getAuthHeaders() {
        const token =
            typeof window !== "undefined"
                ? localStorage.getItem("token")
                : null;
        return token ? { Authorization: `Bearer ${token}` } : {};
    },

    // Manga
    async getManga(params?: {
        page?: number;
        limit?: number;
        status?: string;
        type?: string;
        search?: string;
    }) {
        const searchParams = new URLSearchParams();
        if (params?.page) searchParams.set("page", String(params.page));
        if (params?.limit) searchParams.set("limit", String(params.limit));
        if (params?.status) searchParams.set("status", params.status);
        if (params?.type) searchParams.set("type", params.type);
        if (params?.search) searchParams.set("search", params.search);

        const res = await fetch(`${API_URL}/manga?${searchParams}`);
        return res.json() as Promise<ApiResponse<Manga[]>>;
    },

    async getMangaBySlug(slug: string) {
        const res = await fetch(`${API_URL}/manga/${slug}`);
        return res.json() as Promise<
            ApiResponse<Manga & { chapters: Chapter[] }>
        >;
    },

    // Chapters
    async getChapters(mangaSlug: string) {
        const res = await fetch(`${API_URL}/chapters/manga/${mangaSlug}`);
        return res.json() as Promise<ApiResponse<Chapter[]>>;
    },

    async getChapterPages(chapterId: string) {
        const res = await fetch(`${API_URL}/chapters/${chapterId}/pages`);
        return res.json() as Promise<ApiResponse<Chapter & { pages: Page[] }>>;
    },
};
