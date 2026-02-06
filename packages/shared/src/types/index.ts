// ============ API Response Types ============
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
    cached?: boolean;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
    pagination: {
        page: number;
        limit: number;
        total?: number;
        hasMore?: boolean;
    };
}

// ============ Manga Types ============
export type MangaStatus = "ongoing" | "completed" | "hiatus" | "cancelled";
export type MangaType = "manga" | "manhwa" | "manhua" | "webtoon";

export interface Manga {
    id: string;
    title: string;
    slug: string;
    description?: string;
    coverUrl?: string;
    bannerUrl?: string;
    author?: string;
    artist?: string;
    status: MangaStatus;
    type: MangaType;
    releaseYear?: number;
    isNsfw: boolean;
    viewCount: number;
    createdAt: string;
    updatedAt: string;
}

export interface MangaWithChapters extends Manga {
    chapters: Chapter[];
}

// ============ Chapter Types ============
export interface Chapter {
    id: string;
    mangaId: string;
    number: number;
    title?: string;
    slug: string;
    pageCount: number;
    createdAt: string;
}

export interface ChapterWithPages extends Chapter {
    pages: Page[];
}

// ============ Page Types ============
export interface Page {
    id: string;
    chapterId: string;
    pageNumber: number;
    imageUrl: string;
    width?: number;
    height?: number;
}

// ============ User Types ============
export interface User {
    id: string;
    email: string;
    username: string;
    avatarUrl?: string;
    isAdmin: boolean;
    createdAt: string;
}

export interface ReadingProgress {
    id: string;
    userId: string;
    mangaId: string;
    chapterId: string;
    pageNumber: number;
    updatedAt: string;
}

// ============ Genre Types ============
export interface Genre {
    id: string;
    name: string;
    slug: string;
}
