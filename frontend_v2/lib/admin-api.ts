import { request } from "./api"
import type {
  ApiResponse,
  PaginatedResponse,
  Manga,
  Chapter,
  ChapterWithPages,
} from "./types"
import type {
  AdminStats,
  ActivityLogEntry,
  MangaInput,
  ChapterInput,
  AdminUser,
  AdminAnalytics,
  SiteSettings,
} from "./admin-types"

/**
 * Admin API client.
 *
 * Every method here targets an `/api/admin/*` endpoint. Endpoints marked
 * "NOT YET IMPLEMENTED" do not exist on the live backend yet — they are fully
 * specified in ADMIN_API.md for backend implementation. Until then, calls to
 * them will reject; the UI surfaces this gracefully.
 *
 * All admin endpoints require a Bearer token belonging to a user whose role
 * is "admin"; the backend must enforce this (401/403).
 */

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export const adminDashboard = {
  /** GET /api/admin/stats — NOT YET IMPLEMENTED */
  stats: () => request<ApiResponse<AdminStats>>("/api/admin/stats"),

  /** GET /api/admin/activity — NOT YET IMPLEMENTED */
  activity: (limit = 20) =>
    request<ApiResponse<ActivityLogEntry[]>>(`/api/admin/activity?limit=${limit}`),
}

// ---------------------------------------------------------------------------
// Manga management
// ---------------------------------------------------------------------------

export const adminManga = {
  /**
   * GET /api/admin/manga — list with admin metadata.
   * Falls back to the public GET /api/manga today; the admin variant should
   * additionally return drafts/unpublished titles. NOT YET IMPLEMENTED (admin variant).
   */
  list: (params?: {
    page?: number
    limit?: number
    search?: string
    status?: string
    type?: string
  }) => {
    const query = new URLSearchParams()
    if (params?.page) query.set("page", String(params.page))
    if (params?.limit) query.set("limit", String(params.limit))
    if (params?.search) query.set("search", params.search)
    if (params?.status) query.set("status", params.status)
    if (params?.type) query.set("type", params.type)
    return request<PaginatedResponse<Manga>>(`/api/admin/manga?${query}`)
  },

  /** GET /api/admin/manga/:id — NOT YET IMPLEMENTED (use public GET /api/manga/:slug today) */
  get: (id: string) => request<ApiResponse<Manga>>(`/api/admin/manga/${id}`),

  /** POST /api/admin/manga — NOT YET IMPLEMENTED */
  create: (input: MangaInput) =>
    request<ApiResponse<Manga>>("/api/admin/manga", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  /** PATCH /api/admin/manga/:id — NOT YET IMPLEMENTED */
  update: (id: string, input: Partial<MangaInput>) =>
    request<ApiResponse<Manga>>(`/api/admin/manga/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),

  /** DELETE /api/admin/manga/:id — NOT YET IMPLEMENTED */
  remove: (id: string) =>
    request<{ success: boolean; message: string }>(`/api/admin/manga/${id}`, {
      method: "DELETE",
    }),
}

// ---------------------------------------------------------------------------
// Chapter & page management
// ---------------------------------------------------------------------------

export const adminChapters = {
  /** GET /api/chapters/manga/:slug — EXISTS (public read). */
  listByManga: (mangaSlug: string) =>
    request<ApiResponse<Chapter[]>>(`/api/chapters/manga/${mangaSlug}`),

  /** GET /api/chapters/:id/pages — EXISTS (public read). */
  getPages: (chapterId: string) =>
    request<ApiResponse<ChapterWithPages>>(`/api/chapters/${chapterId}/pages`),

  /** POST /api/admin/chapters — NOT YET IMPLEMENTED */
  create: (input: ChapterInput) =>
    request<ApiResponse<Chapter>>("/api/admin/chapters", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  /** PATCH /api/admin/chapters/:id — NOT YET IMPLEMENTED */
  update: (id: string, input: Partial<ChapterInput>) =>
    request<ApiResponse<Chapter>>(`/api/admin/chapters/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),

  /** DELETE /api/admin/chapters/:id — NOT YET IMPLEMENTED */
  remove: (id: string) =>
    request<{ success: boolean; message: string }>(`/api/admin/chapters/${id}`, {
      method: "DELETE",
    }),

  /**
   * PUT /api/admin/chapters/:id/pages — replace the ordered page list.
   * NOT YET IMPLEMENTED.
   */
  setPages: (id: string, pages: string[]) =>
    request<ApiResponse<ChapterWithPages>>(`/api/admin/chapters/${id}/pages`, {
      method: "PUT",
      body: JSON.stringify({ pages }),
    }),
}

// ---------------------------------------------------------------------------
// User management
// ---------------------------------------------------------------------------

export const adminUsers = {
  /** GET /api/admin/users — NOT YET IMPLEMENTED */
  list: (params?: {
    page?: number
    limit?: number
    search?: string
    role?: string
    status?: string
  }) => {
    const query = new URLSearchParams()
    if (params?.page) query.set("page", String(params.page))
    if (params?.limit) query.set("limit", String(params.limit))
    if (params?.search) query.set("search", params.search)
    if (params?.role) query.set("role", params.role)
    if (params?.status) query.set("status", params.status)
    return request<PaginatedResponse<AdminUser>>(`/api/admin/users?${query}`)
  },

  /** PATCH /api/admin/users/:id/role — NOT YET IMPLEMENTED */
  setRole: (id: string, role: "user" | "admin") =>
    request<ApiResponse<AdminUser>>(`/api/admin/users/${id}/role`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    }),

  /** PATCH /api/admin/users/:id/status — NOT YET IMPLEMENTED */
  setStatus: (id: string, status: "active" | "suspended" | "banned") =>
    request<ApiResponse<AdminUser>>(`/api/admin/users/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  /** DELETE /api/admin/users/:id — NOT YET IMPLEMENTED */
  remove: (id: string) =>
    request<{ success: boolean; message: string }>(`/api/admin/users/${id}`, {
      method: "DELETE",
    }),
}

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------

export const adminAnalytics = {
  /** GET /api/admin/analytics?period=30d — NOT YET IMPLEMENTED */
  get: (period: "7d" | "30d" | "90d" = "30d") =>
    request<ApiResponse<AdminAnalytics>>(`/api/admin/analytics?period=${period}`),
}

// ---------------------------------------------------------------------------
// Site settings
// ---------------------------------------------------------------------------

export const adminSettings = {
  /** GET /api/admin/settings — NOT YET IMPLEMENTED */
  get: () => request<ApiResponse<SiteSettings>>("/api/admin/settings"),

  /** PUT /api/admin/settings — NOT YET IMPLEMENTED */
  update: (settings: Partial<SiteSettings>) =>
    request<ApiResponse<SiteSettings>>("/api/admin/settings", {
      method: "PUT",
      body: JSON.stringify(settings),
    }),
}
