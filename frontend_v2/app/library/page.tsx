"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Bookmark, BookOpen, Library, ArrowRight, Loader2 } from "lucide-react"
import useSWR from "swr"
import { Navbar } from "@/components/navbar"
import { MangaCard } from "@/components/manga-card"
import { useAuth } from "@/lib/auth-context"
import { user as userApi } from "@/lib/api"
import type { ReadingProgress, Bookmark as BookmarkItem } from "@/lib/types"

function CardSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <div className="aspect-[2/3] rounded-md bg-card animate-pulse" />
      <div className="h-3 rounded bg-card animate-pulse w-3/4" />
    </div>
  )
}

function RowSkeleton() {
  return <div className="h-14 rounded-md bg-card animate-pulse" />
}

export default function LibraryPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) router.push("/auth?redirect=/library")
  }, [user, loading, router])

  const { data: bookmarksData, isLoading: bookmarksLoading } = useSWR(
    user ? "bookmarks" : null,
    () => userApi.bookmarks()
  )

  const { data: progressData, isLoading: progressLoading } = useSWR(
    user ? "progress-all" : null,
    () => userApi.progress()
  )

  const bookmarks = bookmarksData?.data ?? []
  const progressList = progressData?.data ?? []

  // Build a mangaId → bookmark map so progress rows can show title + cover.
  const mangaById = new Map(bookmarks.map((b) => [b.id, b]))

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex justify-center py-24">
          <Loader2 className="size-5 text-primary animate-spin" />
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <h1 className="flex items-center gap-2 text-xl font-semibold text-foreground mb-8">
          <Library className="size-5 text-primary" />
          My Library
        </h1>

        {/* Bookmarks */}
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="flex items-center gap-2 text-base font-medium text-foreground">
              <Bookmark className="size-4 text-primary" />
              Bookmarks
            </h2>
            {!bookmarksLoading && (
              <span className="text-xs text-muted-foreground">({bookmarks.length})</span>
            )}
          </div>

          {bookmarksLoading ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          ) : bookmarks.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4">
              {bookmarks.map((item) => (
                <MangaCard
                  key={item.id}
                  slug={item.slug}
                  title={item.title}
                  coverUrl={item.coverUrl}
                  type={item.type}
                  status={item.status}
                />
              ))}
            </div>
          ) : (
            <div className="py-12 flex flex-col items-center gap-3 text-center rounded-md border border-dashed border-border">
              <Bookmark className="size-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No bookmarks yet.</p>
              <Link
                href="/browse"
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                Browse manga <ArrowRight className="size-3" />
              </Link>
            </div>
          )}
        </section>

        {/* Continue Reading */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="flex items-center gap-2 text-base font-medium text-foreground">
              <BookOpen className="size-4 text-primary" />
              Continue Reading
            </h2>
            {!progressLoading && (
              <span className="text-xs text-muted-foreground">({progressList.length})</span>
            )}
          </div>

          {progressLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <RowSkeleton key={i} />
              ))}
            </div>
          ) : progressList.length > 0 ? (
            <div className="flex flex-col divide-y divide-border border border-border rounded-md overflow-hidden">
              {progressList.map((item) => (
                <ProgressRow
                  key={`${item.mangaId}-${item.chapterId}`}
                  item={item}
                  bookmark={mangaById.get(item.mangaId)}
                />
              ))}
            </div>
          ) : (
            <div className="py-12 flex flex-col items-center gap-3 text-center rounded-md border border-dashed border-border">
              <BookOpen className="size-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">
                {"You haven't started reading anything yet."}
              </p>
              <Link
                href="/browse"
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                Start reading <ArrowRight className="size-3" />
              </Link>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

interface ProgressRowProps {
  item: ReadingProgress
  /** Resolved from the bookmarks map; may be undefined if the manga is not bookmarked. */
  bookmark?: BookmarkItem
}

function ProgressRow({ item, bookmark }: ProgressRowProps) {
  const chapterNum = item.chapter?.number
  const chapterTitle = item.chapter?.title
  const updatedAt = new Date(item.updatedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })

  const continueHref = bookmark ? `/manga/${bookmark.slug}/${item.chapterId}` : null
  const [imgError, setImgError] = useState(false)

  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-card transition-colors">
      {/* Cover thumbnail */}
      {bookmark ? (
        <Link href={`/manga/${bookmark.slug}`} className="shrink-0" tabIndex={-1} aria-hidden="true">
          {!imgError ? (
            <img
              src={bookmark.coverUrl}
              alt=""
              className="w-9 aspect-[2/3] object-cover rounded"
              loading="lazy"
              decoding="async"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-9 aspect-[2/3] rounded bg-card flex items-center justify-center">
              <BookOpen className="size-3 text-muted-foreground/40" />
            </div>
          )}
        </Link>
      ) : (
        <div className="shrink-0 w-9 aspect-[2/3] rounded bg-card flex items-center justify-center">
          <BookOpen className="size-3 text-muted-foreground/30" />
        </div>
      )}

      {/* Info */}
      <div className="flex flex-col min-w-0 gap-0.5 flex-1">
        {bookmark && (
          <Link
            href={`/manga/${bookmark.slug}`}
            className="text-xs font-medium text-muted-foreground hover:text-foreground truncate transition-colors"
          >
            {bookmark.title}
          </Link>
        )}
        <span className="text-sm text-foreground font-medium truncate">
          {chapterNum != null
            ? `Chapter ${chapterNum}${chapterTitle ? ` — ${chapterTitle}` : ""}`
            : "Unknown chapter"}
        </span>
        <span className="text-xs text-muted-foreground tabular-nums">
          Page {item.pageNumber} · {updatedAt}
        </span>
      </div>

      {continueHref ? (
        <Link
          href={continueHref}
          className="shrink-0 flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
        >
          <BookOpen className="size-3" />
          Continue
        </Link>
      ) : (
        <span className="shrink-0 text-xs text-muted-foreground/50">
          Bookmark to continue
        </span>
      )}
    </div>
  )
}
