export interface User {
  id: string
  email: string
  username: string
  role: "user" | "admin"
  avatarUrl: string | null
}

export interface Session {
  access_token: string
  refresh_token: string
  expires_in: number
}

export interface Manga {
  id: string
  title: string
  slug: string
  description?: string
  coverUrl: string
  bannerUrl?: string
  author: string
  artist?: string
  status: "ongoing" | "completed" | "hiatus" | "cancelled"
  type: "manga" | "manhwa" | "manhua" | "webtoon"
  releaseYear?: number
  isNsfw: boolean
  viewCount: number
  createdAt: string
  updatedAt: string
  chapters?: Chapter[]
}

export interface Chapter {
  id: string
  mangaId: string
  number: number
  title: string | null
  slug: string
  pageCount: number
  createdAt: string
}

export interface Page {
  id: string
  chapterId: string
  pageNumber: number
  imageUrl: string
  width: number
  height: number
}

export interface ChapterWithPages extends Chapter {
  pages: Page[]
}

export interface Bookmark {
  id: string
  title: string
  slug: string
  coverUrl: string
  status: string
  type: string
}

export interface ReadingProgress {
  userId: string
  mangaId: string
  chapterId: string
  pageNumber: number
  updatedAt: string
  /** Populated by GET /api/user/progress/:mangaId, not by the list endpoint. */
  chapter?: {
    id: string
    number: number
    title: string | null
    slug: string
  }
  /** Populated by GET /api/user/bookmarks — cross-referenced on the frontend. */
  mangaSlug?: string
  mangaTitle?: string
  mangaCoverUrl?: string
}

export interface TrendingManga {
  id: string
  title: string
  slug: string
  coverUrl: string
  viewCount: number
  status: string
  type: string
}

/** Live shape of GET /api/trending — array nested under `manga` */
export interface TrendingResponse {
  success: boolean
  data: {
    period: "1d" | "7d" | "30d"
    limit: number
    offset: number
    total: number
    manga: TrendingManga[]
    generatedAt: string
    expiresAt: string
  }
  cached?: boolean
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  cached?: boolean
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  pagination: { page: number; limit: number }
  cached?: boolean
}

export interface ApiError {
  success: false
  error: string
  message: string
  details?: { field: string; message: string }[]
}
