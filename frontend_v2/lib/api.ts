import type {
  ApiResponse,
  PaginatedResponse,
  User,
  Session,
  Manga,
  Chapter,
  ChapterWithPages,
  Bookmark,
  ReadingProgress,
  TrendingManga,
  TrendingResponse,
} from "./types"

// Public, non-secret API base. NEXT_PUBLIC_API_URL overrides it when set.
// Trailing slashes are stripped so `${BASE_URL}${path}` never doubles up.
const DEFAULT_API_URL = "https://api.mangaden.rejwanul.dev"
const BASE_URL = (process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL).replace(/\/+$/, "")

/** API caps page size at 50 (server-side Zod validation). */
const MAX_LIMIT = 50

function clampLimit(limit?: number): number | undefined {
  if (limit == null) return undefined
  return Math.min(Math.max(1, limit), MAX_LIMIT)
}

/**
 * Normalizes the various error shapes the API can return into a single
 * human-readable string. The live API returns at least two shapes:
 *   1. { success:false, error:"Internal server error", message:"..." }
 *   2. { success:false, error:{ issues:[{message,path}], name:"ZodError" } }
 * and the docs describe a third: { error:"Validation Error", details:[...] }.
 */
export function getErrorMessage(err: unknown, fallback = "Something went wrong."): string {
  if (!err || typeof err !== "object") return fallback
  const e = err as {
    message?: string
    error?: string | { issues?: { message: string; path?: string[] }[] }
    details?: { field: string; message: string }[]
  }

  // ZodError shape: error.issues[]
  if (e.error && typeof e.error === "object" && Array.isArray(e.error.issues)) {
    const first = e.error.issues[0]
    if (first) {
      const field = first.path?.[0]
      return field ? `${field}: ${first.message}` : first.message
    }
  }

  // Documented validation shape: details[]
  if (Array.isArray(e.details) && e.details.length > 0) {
    return `${e.details[0].field}: ${e.details[0].message}`
  }

  // Plain message
  if (typeof e.message === "string" && e.message) return e.message
  if (typeof e.error === "string" && e.error) return e.error

  return fallback
}

/**
 * Builds an Error-like object from a failed Response, attaching the HTTP
 * status so callers (e.g. SWR consumers) can branch on 404 vs 401 etc.
 */
async function toError(res: Response): Promise<Record<string, unknown>> {
  let body: Record<string, unknown> = {}
  try {
    body = await res.json()
  } catch {
    body = { error: res.statusText }
  }
  return { ...body, status: res.status }
}

export async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: "include",
  })

  if (res.status === 401) {
    // Attempt silent token refresh
    const refreshed = await tryRefreshToken()
    if (refreshed) {
      const newToken = localStorage.getItem("access_token")
      if (newToken) headers["Authorization"] = `Bearer ${newToken}`
      const retry = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers,
        credentials: "include",
      })
      if (!retry.ok) {
        throw await toError(retry)
      }
      return retry.json()
    }
    // Clear auth state if refresh failed
    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token")
      localStorage.removeItem("refresh_token")
    }
  }

  if (!res.ok) {
    throw await toError(res)
  }

  return res.json()
}

async function tryRefreshToken(): Promise<boolean> {
  try {
    const refreshToken = localStorage.getItem("refresh_token")
    if (!refreshToken) return false

    const res = await fetch(`${BASE_URL}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
      credentials: "include",
    })

    if (!res.ok) return false

    const data: ApiResponse<{ session: Session }> = await res.json()
    if (data.success) {
      localStorage.setItem("access_token", data.data.session.access_token)
      localStorage.setItem("refresh_token", data.data.session.refresh_token)
      return true
    }
    return false
  } catch {
    return false
  }
}

// Auth
export const auth = {
  signUp: (email: string, password: string, username: string) =>
    request<ApiResponse<{ user: User; session: Session }>>("/api/auth/sign-up", {
      method: "POST",
      body: JSON.stringify({ email, password, username }),
    }),

  signIn: (email: string, password: string) =>
    request<ApiResponse<{ user: User; session: Session }>>("/api/auth/sign-in", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  signOut: () =>
    request<{ success: boolean; message: string }>("/api/auth/sign-out", {
      method: "POST",
    }),

  me: () => request<ApiResponse<{ user: User }>>("/api/auth/me"),
}

// Manga
export const manga = {
  list: (params?: {
    page?: number
    limit?: number
    search?: string
    status?: string
    type?: string
  }) => {
    const query = new URLSearchParams()
    if (params?.page) query.set("page", String(params.page))
    const limit = clampLimit(params?.limit)
    if (limit) query.set("limit", String(limit))
    if (params?.search) query.set("search", params.search)
    if (params?.status) query.set("status", params.status)
    if (params?.type) query.set("type", params.type)
    return request<PaginatedResponse<Manga>>(`/api/manga?${query}`)
  },

  get: (slug: string) =>
    request<ApiResponse<Manga>>(`/api/manga/${slug}`),

  trackView: (slug: string) =>
    request<{ success: boolean; counted: boolean }>(`/api/manga/${slug}/view`, {
      method: "POST",
    }),
}

// Chapters
export const chapters = {
  list: (mangaSlug: string) =>
    request<ApiResponse<Chapter[]>>(`/api/chapters/manga/${mangaSlug}`),

  pages: (chapterId: string) =>
    request<ApiResponse<ChapterWithPages>>(`/api/chapters/${chapterId}/pages`),
}

// Trending
export const trending = {
  /**
   * The live API nests the manga array under `data.manga`. This helper
   * unwraps it and always resolves to a flat `TrendingManga[]`.
   */
  get: async (
    period: "1d" | "7d" | "30d" = "7d",
    limit = 20
  ): Promise<TrendingManga[]> => {
    const safeLimit = clampLimit(limit) ?? 20
    const res = await request<TrendingResponse>(
      `/api/trending?period=${period}&limit=${safeLimit}`
    )
    return res.success ? res.data.manga : []
  },
}

// User
export const user = {
  bookmarks: () =>
    request<ApiResponse<Bookmark[]>>("/api/user/bookmarks"),

  addBookmark: (mangaId: string) =>
    request<ApiResponse<{ id: string; userId: string; mangaId: string; createdAt: string }>>(
      `/api/user/bookmarks/${mangaId}`,
      { method: "POST" }
    ),

  removeBookmark: (mangaId: string) =>
    request<{ success: boolean; message: string }>(
      `/api/user/bookmarks/${mangaId}`,
      { method: "DELETE" }
    ),

  progress: () =>
    request<ApiResponse<ReadingProgress[]>>("/api/user/progress"),

  getProgress: (mangaId: string) =>
    request<ApiResponse<ReadingProgress | null>>(`/api/user/progress/${mangaId}`),

  saveProgress: (mangaId: string, chapterId: string, pageNumber: number) =>
    request<ApiResponse<ReadingProgress>>("/api/user/progress", {
      method: "POST",
      body: JSON.stringify({ mangaId, chapterId, pageNumber }),
    }),
}
