"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  BookOpen,
  Bookmark,
  BookmarkCheck,
  Eye,
  Calendar,
  User,
  Paintbrush,
  ChevronDown,
  ChevronUp,
  ArrowRight,
} from "lucide-react"
import useSWR from "swr"
import { useAuth } from "@/lib/auth-context"
import { manga as mangaApi, chapters as chaptersApi, user as userApi } from "@/lib/api"
import type { Manga, Chapter } from "@/lib/types"
import { cn } from "@/lib/utils"

const STATUS_COLORS: Record<string, string> = {
  ongoing: "bg-green-500/15 text-green-400 border-green-500/20",
  completed: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  hiatus: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  cancelled: "bg-red-500/15 text-red-400 border-red-500/20",
}

function formatViewCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return String(n)
}

export function MangaDetailClient({ manga }: { manga: Manga }) {
  const { user } = useAuth()
  const [descExpanded, setDescExpanded] = useState(false)
  const [bookmarked, setBookmarked] = useState(false)
  const [bookmarkLoading, setBookmarkLoading] = useState(false)
  const [sortAsc, setSortAsc] = useState(false)
  const [chapterListExpanded, setChapterListExpanded] = useState(false)

  const CHAPTER_CAP = 100

  // Use chapters embedded in manga if present; otherwise fall back to the
  // dedicated chapters endpoint (some API responses omit the embedded array).
  const needsFallback = !manga.chapters || manga.chapters.length === 0
  const { data: fallbackChaptersData } = useSWR(
    needsFallback ? ["chapters", manga.slug] : null,
    () => chaptersApi.list(manga.slug)
  )
  const chapters: Chapter[] =
    manga.chapters && manga.chapters.length > 0
      ? manga.chapters
      : (fallbackChaptersData?.data ?? [])
  const sortedChapters = [...chapters].sort((a, b) =>
    sortAsc ? a.number - b.number : b.number - a.number
  )
  const visibleChapters = chapterListExpanded
    ? sortedChapters
    : sortedChapters.slice(0, CHAPTER_CAP)

  // Fetch bookmark list only when signed in
  const { data: bookmarksData, mutate: mutateBookmarks } = useSWR(
    user ? "bookmarks" : null,
    () => userApi.bookmarks()
  )

  useEffect(() => {
    if (bookmarksData?.data) {
      setBookmarked(bookmarksData.data.some((b) => b.id === manga.id))
    }
  }, [bookmarksData, manga.id])

  // Track view once on mount
  useEffect(() => {
    mangaApi.trackView(manga.slug).catch(() => {})
  }, [manga.slug])

  // Fetch reading progress for this manga
  const { data: progressData } = useSWR(
    user ? ["progress", manga.id] : null,
    () => userApi.getProgress(manga.id)
  )
  const progress = progressData?.data ?? null

  async function toggleBookmark() {
    if (!user) return
    setBookmarkLoading(true)
    try {
      if (bookmarked) {
        await userApi.removeBookmark(manga.id)
        setBookmarked(false)
      } else {
        await userApi.addBookmark(manga.id)
        setBookmarked(true)
      }
      mutateBookmarks()
    } catch {
      // Silently fail — bookmark state will re-sync on next fetch.
    } finally {
      setBookmarkLoading(false)
    }
  }

  // The first chapter is the one with the lowest number.
  const firstChapter = [...chapters].sort((a, b) => a.number - b.number)[0] ?? null
  const continueChapter = progress
    ? chapters.find((c) => c.id === progress.chapterId) ?? null
    : null

  return (
    <main>
      {/* Banner / hero area */}
      <div className="relative overflow-hidden border-b border-border">
        <div
          className="absolute inset-0 blur-3xl opacity-15 scale-110"
          style={{
            backgroundImage: `url(${manga.bannerUrl ?? manga.coverUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center top",
          }}
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-10 flex flex-col sm:flex-row gap-7">
          {/* Cover */}
          <div className="shrink-0">
            <img
              src={manga.coverUrl}
              alt={manga.title}
              className="w-36 sm:w-48 aspect-[2/3] object-cover rounded-lg shadow-xl ring-1 ring-border"
            />
          </div>

          {/* Info */}
          <div className="flex flex-col gap-3 min-w-0 py-1">
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "rounded border px-2 py-0.5 text-[10px] font-medium capitalize",
                  STATUS_COLORS[manga.status] ?? "bg-muted text-muted-foreground border-border"
                )}
              >
                {manga.status}
              </span>
              <span className="rounded border border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground capitalize">
                {manga.type}
              </span>
              {manga.isNsfw && (
                <span className="rounded border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[10px] font-medium text-red-400">
                  18+
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-foreground text-balance leading-snug">
              {manga.title}
            </h1>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {manga.author && (
                <span className="flex items-center gap-1">
                  <User className="size-3" />
                  {manga.author}
                </span>
              )}
              {manga.artist && manga.artist !== manga.author && (
                <span className="flex items-center gap-1">
                  <Paintbrush className="size-3" />
                  {manga.artist}
                </span>
              )}
              {manga.releaseYear && (
                <span className="flex items-center gap-1">
                  <Calendar className="size-3" />
                  {manga.releaseYear}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Eye className="size-3" />
                {formatViewCount(manga.viewCount)} views
              </span>
            </div>

            {/* Description */}
            {manga.description && (
              <div className="relative">
                <p
                  className={cn(
                    "text-sm text-muted-foreground leading-relaxed",
                    !descExpanded && "line-clamp-3"
                  )}
                >
                  {manga.description}
                </p>
                {manga.description.length > 200 && (
                  <button
                    onClick={() => setDescExpanded(!descExpanded)}
                    className="mt-1 flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                  >
                    {descExpanded ? (
                      <>Less <ChevronUp className="size-3" /></>
                    ) : (
                      <>More <ChevronDown className="size-3" /></>
                    )}
                  </button>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-2 mt-1">
              {continueChapter ? (
                <Link
                  href={`/manga/${manga.slug}/${continueChapter.id}`}
                  className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <BookOpen className="size-3.5" />
                  Continue Ch.{continueChapter.number}
                </Link>
              ) : firstChapter ? (
                <Link
                  href={`/manga/${manga.slug}/${firstChapter.id}`}
                  className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <BookOpen className="size-3.5" />
                  Start Reading
                </Link>
              ) : null}

              {user && (
                <button
                  onClick={toggleBookmark}
                  disabled={bookmarkLoading}
                  aria-label={bookmarked ? "Remove bookmark" : "Add bookmark"}
                  className={cn(
                    "flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition-colors",
                    bookmarked
                      ? "border-primary/50 bg-primary/10 text-primary hover:bg-primary/20"
                      : "border-border text-muted-foreground hover:text-foreground hover:border-primary/50"
                  )}
                >
                  {bookmarked ? (
                    <BookmarkCheck className="size-3.5" />
                  ) : (
                    <Bookmark className="size-3.5" />
                  )}
                  {bookmarked ? "Bookmarked" : "Bookmark"}
                </button>
              )}

              {!user && firstChapter && (
                <Link
                  href={`/auth?redirect=/manga/${manga.slug}`}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  <Bookmark className="size-3" />
                  Sign in to bookmark
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Chapter list */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-foreground">
            Chapters
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              ({chapters.length})
            </span>
          </h2>
          <button
            onClick={() => setSortAsc(!sortAsc)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {sortAsc ? (
              <>
                <ChevronDown className="size-3.5" />
                Oldest first
              </>
            ) : (
              <>
                <ChevronUp className="size-3.5" />
                Newest first
              </>
            )}
          </button>
        </div>

        {sortedChapters.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No chapters available yet.
          </p>
        ) : (
          <div className="flex flex-col divide-y divide-border border border-border rounded-md overflow-hidden">
            {visibleChapters.map((ch) => {
              const isCurrent = progress?.chapterId === ch.id
              return (
                <Link
                  key={ch.id}
                  href={`/manga/${manga.slug}/${ch.id}`}
                  className={cn(
                    "group flex items-center justify-between px-4 py-3 text-sm transition-colors hover:bg-card",
                    isCurrent && "bg-primary/5"
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={cn(
                        "shrink-0 w-16 text-xs font-medium tabular-nums",
                        isCurrent ? "text-primary" : "text-muted-foreground"
                      )}
                    >
                      Ch. {ch.number}
                    </span>
                    <span className="text-foreground truncate">
                      {ch.title ?? `Chapter ${ch.number}`}
                    </span>
                    {isCurrent && (
                      <span className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium bg-primary/15 text-primary">
                        Reading
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-muted-foreground hidden sm:inline tabular-nums">
                      {new Date(ch.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                    <ArrowRight className="size-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {/* Show more / show less toggle — only rendered when list exceeds the cap */}
        {chapters.length > CHAPTER_CAP && (
          <button
            onClick={() => setChapterListExpanded(!chapterListExpanded)}
            className="mt-3 flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors"
          >
            {chapterListExpanded
              ? "Show less"
              : `Show all ${chapters.length} chapters`}
            {chapterListExpanded ? (
              <ChevronUp className="size-3" />
            ) : (
              <ChevronDown className="size-3" />
            )}
          </button>
        )}
      </div>
    </main>
  )
}
