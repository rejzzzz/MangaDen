# Admin Portal — Backend API Specification

This document describes every backend endpoint the MangaDen admin portal
(`/admin/*`) expects. The **frontend is already fully built** against these
contracts. Endpoints marked **EXISTS** are already live; endpoints marked
**TODO** must be implemented on the backend.

The frontend client lives in `lib/admin-api.ts` and the request/response types
in `lib/admin-types.ts`. If you change a shape here, update both files (or this
doc) to keep them in sync.

---

## Conventions

### Authentication & authorization
- Every `/api/admin/*` endpoint requires an `Authorization: Bearer <token>`
  header.
- The token must belong to a user whose `role === "admin"`.
- Return **401** if the token is missing/invalid, **403** if the user is
  authenticated but not an admin.
- The frontend route guard (`components/admin/admin-shell.tsx`) also checks
  `user.role === "admin"` client-side, but **the backend MUST enforce this** —
  client checks are for UX only.

### Response envelopes
The existing API uses two envelope shapes. Reuse them:

```ts
// Single resource
interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

// Paginated list
interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number      // total matching records (used for page count)
    totalPages: number
  }
}
```

> NOTE: The current public `PaginatedResponse` only guarantees `page` and
> `limit`. The admin list views render accurate pagination when `total` /
> `totalPages` are present. Please include them on all admin list endpoints.

### Errors
On failure, return the appropriate HTTP status and a JSON body:

```json
{ "success": false, "message": "Human-readable error" }
```

The frontend surfaces `message` directly in a toast.

### Audit logging
Every mutating admin action (create/update/delete/role/status/settings) SHOULD
append an `ActivityLogEntry` (see `/api/admin/activity`). The dashboard's
"Recent activity" feed reads from it.

---

## 1. Dashboard

### `GET /api/admin/stats` — TODO
Aggregate counts for the dashboard cards.

**Response** `ApiResponse<AdminStats>`:
```ts
interface AdminStats {
  totalManga: number
  totalChapters: number
  totalUsers: number
  totalViews: number
  newMangaThisMonth: number   // last 30 days
  newUsersThisMonth: number   // last 30 days
  viewsThisMonth: number      // last 30 days
  activeUsers: number         // any activity in last 30 days
}
```
> Until implemented, the dashboard falls back to deriving rough totals from the
> public `GET /api/manga` and `GET /api/manga/trending` endpoints.

### `GET /api/admin/activity?limit=20` — TODO
Most recent admin actions, newest first.

**Response** `ApiResponse<ActivityLogEntry[]>`:
```ts
interface ActivityLogEntry {
  id: string
  actorId: string
  actorName: string
  action: string              // "manga.create", "user.ban", "chapter.delete", ...
  summary: string             // 'Created manga "One Piece"'
  targetType?: "manga" | "chapter" | "user" | "setting"
  targetId?: string
  createdAt: string           // ISO 8601
}
```

---

## 2. Manga management

### `GET /api/admin/manga` — TODO (admin variant)
List titles for the admin table. Same query params as the public list, but
should additionally include unpublished/draft titles.

**Query params:** `page`, `limit`, `search`, `status`, `type`

**Response:** `PaginatedResponse<Manga>`
> Falls back to the public `GET /api/manga` today, which only returns published
> titles and may omit `total`.

### `GET /api/admin/manga/:id` — TODO
Fetch one title by **id** (not slug) including any draft/admin-only fields.

**Response:** `ApiResponse<Manga>`
> The edit page falls back to the public `GET /api/manga/:slug` today.

### `POST /api/admin/manga` — TODO
Create a title.

**Body** `MangaInput`:
```ts
interface MangaInput {
  title: string
  slug?: string          // auto-generated from title if omitted
  description: string
  coverUrl: string
  bannerUrl?: string
  author: string
  artist?: string
  status: "ongoing" | "completed" | "hiatus" | "cancelled"
  type: "manga" | "manhwa" | "manhua" | "webtoon"
  releaseYear?: number
  isNsfw: boolean
  genres?: string[]      // backend may model as a join table
}
```
**Response:** `ApiResponse<Manga>` (the created record, with `id` and `slug`)

### `PATCH /api/admin/manga/:id` — TODO
Update a title. Body is a partial `MangaInput`. **Response:** `ApiResponse<Manga>`

### `DELETE /api/admin/manga/:id` — TODO
Delete a title and cascade-delete its chapters & pages.
**Response:** `{ success: boolean; message: string }`

---

## 3. Chapter & page management

### `GET /api/chapters/manga/:slug` — EXISTS
List a title's chapters (public read, reused by admin).
**Response:** `ApiResponse<Chapter[]>`

### `GET /api/chapters/:id/pages` — EXISTS
Get a chapter with its ordered page images (public read, reused by admin).
**Response:** `ApiResponse<ChapterWithPages>`

### `POST /api/admin/chapters` — TODO
Create a chapter.

**Body** `ChapterInput`:
```ts
interface ChapterInput {
  mangaId: string
  number: number
  title?: string
  pages?: string[]       // ordered page image URLs
}
```
**Response:** `ApiResponse<Chapter>`

### `PATCH /api/admin/chapters/:id` — TODO
Update a chapter (number, title). Body is a partial `ChapterInput`.
**Response:** `ApiResponse<Chapter>`

### `DELETE /api/admin/chapters/:id` — TODO
Delete a chapter and its pages.
**Response:** `{ success: boolean; message: string }`

### `PUT /api/admin/chapters/:id/pages` — TODO
Replace the entire ordered page list for a chapter (used by the page manager
after reordering / adding / removing images).

**Body:**
```json
{ "pages": ["https://cdn/.../001.webp", "https://cdn/.../002.webp"] }
```
**Response:** `ApiResponse<ChapterWithPages>`

> **Image uploads:** the frontend currently accepts page image **URLs**
> (paste/bulk-paste). If you want direct file uploads, add
> `POST /api/admin/upload` returning `{ url }` and we will wire an uploader into
> the chapter editor and manga cover/banner fields.

---

## 4. User management

### `GET /api/admin/users` — TODO
List users for the admin table.

**Query params:** `page`, `limit`, `search` (email/username), `role`, `status`

**Response:** `PaginatedResponse<AdminUser>`:
```ts
type UserStatus = "active" | "suspended" | "banned"

interface AdminUser extends User {   // User: { id, email, username, role }
  status: UserStatus
  createdAt: string
  lastActiveAt?: string
  bookmarkCount?: number
}
```

### `PATCH /api/admin/users/:id/role` — TODO
Promote/demote a user. **Body:** `{ "role": "user" | "admin" }`
**Response:** `ApiResponse<AdminUser>`

### `PATCH /api/admin/users/:id/status` — TODO
Suspend/ban/reactivate. **Body:** `{ "status": "active" | "suspended" | "banned" }`
**Response:** `ApiResponse<AdminUser>`

### `DELETE /api/admin/users/:id` — TODO
Permanently delete a user account.
**Response:** `{ success: boolean; message: string }`

> Guardrails enforced in the UI (please also enforce server-side): an admin
> cannot change their own role, ban themselves, or delete their own account.

---

## 5. Analytics

### `GET /api/admin/analytics?period=30d` — TODO
**Query param:** `period` = `7d` | `30d` | `90d`

**Response** `ApiResponse<AdminAnalytics>`:
```ts
interface AnalyticsPoint { date: string; value: number }   // date = ISO day

interface AdminAnalytics {
  viewsOverTime: AnalyticsPoint[]
  signupsOverTime: AnalyticsPoint[]
  topManga: { id: string; title: string; slug: string; views: number }[]
  typeBreakdown: { type: string; count: number }[]
  statusBreakdown: { status: string; count: number }[]
}
```
> Until implemented, the analytics page derives `topManga`, `typeBreakdown`,
> and `statusBreakdown` from public endpoints and shows the time-series charts
> in an empty/placeholder state.

---

## 6. Site settings

### `GET /api/admin/settings` — TODO
**Response** `ApiResponse<SiteSettings>`:
```ts
interface SiteSettings {
  siteName: string
  siteDescription: string
  maintenanceMode: boolean
  maintenanceMessage: string
  allowRegistration: boolean
  requireEmailVerification: boolean
  showNsfwToGuests: boolean
  defaultReadingMode: "scroll" | "paginated"
  featuredMangaSlug?: string
  features: {
    comments: boolean
    ratings: boolean
    bookmarks: boolean
    readingProgress: boolean
  }
}
```

### `PUT /api/admin/settings` — TODO
Persist settings. Body is a partial `SiteSettings`.
**Response:** `ApiResponse<SiteSettings>`

> These settings are intended to drive real site behavior (maintenance page,
> registration toggle, guest NSFW visibility, feature flags). Wiring the public
> site to consume them is a follow-up once the endpoint exists.

---

## Implementation checklist

- [ ] `GET /api/admin/stats`
- [ ] `GET /api/admin/activity`
- [ ] `GET /api/admin/manga` (admin variant w/ drafts + `total`)
- [ ] `GET /api/admin/manga/:id`
- [ ] `POST /api/admin/manga`
- [ ] `PATCH /api/admin/manga/:id`
- [ ] `DELETE /api/admin/manga/:id`
- [ ] `POST /api/admin/chapters`
- [ ] `PATCH /api/admin/chapters/:id`
- [ ] `DELETE /api/admin/chapters/:id`
- [ ] `PUT /api/admin/chapters/:id/pages`
- [ ] `GET /api/admin/users`
- [ ] `PATCH /api/admin/users/:id/role`
- [ ] `PATCH /api/admin/users/:id/status`
- [ ] `DELETE /api/admin/users/:id`
- [ ] `GET /api/admin/analytics`
- [ ] `GET /api/admin/settings`
- [ ] `PUT /api/admin/settings`
- [ ] (optional) `POST /api/admin/upload` for direct image uploads
