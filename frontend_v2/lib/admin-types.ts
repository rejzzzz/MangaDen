import type { Manga, Chapter, User } from "./types"

/**
 * Admin-specific type definitions.
 *
 * NOTE FOR BACKEND: Many of these describe endpoints that do not yet exist on
 * the live API. They are documented in ADMIN_API.md. The frontend is built
 * against these shapes; implement the backend to match (or adjust both).
 */

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export interface AdminStats {
  totalManga: number
  totalChapters: number
  totalUsers: number
  totalViews: number
  /** New manga added in the last 30 days. */
  newMangaThisMonth: number
  /** New users registered in the last 30 days. */
  newUsersThisMonth: number
  /** Total views in the last 30 days. */
  viewsThisMonth: number
  /** Active users (any activity) in the last 30 days. */
  activeUsers: number
}

export interface ActivityLogEntry {
  id: string
  /** The admin/user who performed the action. */
  actorId: string
  actorName: string
  /** e.g. "manga.create", "user.ban", "chapter.delete". */
  action: string
  /** Human-readable summary, e.g. 'Created manga "One Piece"'. */
  summary: string
  /** Optional target entity reference. */
  targetType?: "manga" | "chapter" | "user" | "setting"
  targetId?: string
  createdAt: string
}

// ---------------------------------------------------------------------------
// Manga management
// ---------------------------------------------------------------------------

/** Payload for creating a manga. Mirrors the editable fields of `Manga`. */
export interface MangaInput {
  title: string
  slug?: string
  description: string
  coverUrl: string
  bannerUrl?: string
  author: string
  artist?: string
  status: Manga["status"]
  type: Manga["type"]
  releaseYear?: number
  isNsfw: boolean
  /** Free-form genre/tag list. Backend may model these as a join table. */
  genres?: string[]
}

// ---------------------------------------------------------------------------
// Chapter management
// ---------------------------------------------------------------------------

export interface ChapterInput {
  mangaId: string
  number: number
  title?: string
  /** Ordered list of page image URLs. */
  pages?: string[]
}

// ---------------------------------------------------------------------------
// User management
// ---------------------------------------------------------------------------

export type UserStatus = "active" | "suspended" | "banned"

/** Extended user record returned by the admin users endpoint. */
export interface AdminUser extends User {
  status: UserStatus
  createdAt: string
  lastActiveAt?: string
  bookmarkCount?: number
}

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------

export interface AnalyticsPoint {
  /** ISO date (day granularity). */
  date: string
  value: number
}

export interface AdminAnalytics {
  /** Daily view counts over the requested window. */
  viewsOverTime: AnalyticsPoint[]
  /** Daily new-user counts over the requested window. */
  signupsOverTime: AnalyticsPoint[]
  /** Most viewed titles in the window. */
  topManga: { id: string; title: string; slug: string; views: number }[]
  /** Breakdown of the catalog by type. */
  typeBreakdown: { type: string; count: number }[]
  /** Breakdown of the catalog by status. */
  statusBreakdown: { status: string; count: number }[]
}

// ---------------------------------------------------------------------------
// Site settings
// ---------------------------------------------------------------------------

export interface SiteSettings {
  siteName: string
  siteDescription: string
  /** When true, the public site shows a maintenance page. */
  maintenanceMode: boolean
  maintenanceMessage: string
  /** Allow new user registrations. */
  allowRegistration: boolean
  /** Require email verification on sign-up. */
  requireEmailVerification: boolean
  /** Show NSFW titles to anonymous visitors. */
  showNsfwToGuests: boolean
  /** Default reading mode for the reader. */
  defaultReadingMode: "scroll" | "paginated"
  /** Featured manga slug shown on the homepage hero. */
  featuredMangaSlug?: string
  /** Feature flags toggling site capabilities. */
  features: {
    comments: boolean
    ratings: boolean
    bookmarks: boolean
    readingProgress: boolean
  }
}

export type { Manga, Chapter, User }
