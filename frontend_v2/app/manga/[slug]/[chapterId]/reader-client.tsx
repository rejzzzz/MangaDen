"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Menu,
  X,
  BookOpen,
  Settings,
  AlignJustify,
  LayoutList,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { user as userApi } from "@/lib/api"
import type { ChapterWithPages, Manga, Chapter } from "@/lib/types"
import { cn } from "@/lib/utils"

type ReadMode = "scroll" | "paginated"

interface ReaderClientProps {
  chapter: ChapterWithPages
  manga: Manga
}

export function ReaderClient({ chapter, manga }: ReaderClientProps) {
  const { user } = useAuth()
  const router = useRouter()
  const [mode, setMode] = useState<ReadMode>("scroll")
  const [currentPage, setCurrentPage] = useState(1)
  const [headerVisible, setHeaderVisible] = useState(true)
  const [chapterMenuOpen, setChapterMenuOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const lastScrollY = useRef(0)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const chapters: Chapter[] = manga.chapters ?? []
  const sortedChapters = [...chapters].sort((a, b) => a.number - b.number)
  const currentIndex = sortedChapters.findIndex((c) => c.id === chapter.id)
  const prevChapter = currentIndex > 0 ? sortedChapters[currentIndex - 1] : null
  const nextChapter = currentIndex < sortedChapters.length - 1 ? sortedChapters[currentIndex + 1] : null

  const pages = chapter.pages ?? []
  const totalPages = pages.length

  // Auto-hide header on scroll down; reveal on scroll up or near top.
  useEffect(() => {
    let ticking = false
    const handleScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        const y = window.scrollY
        const delta = y - lastScrollY.current
        if (Math.abs(delta) > 8) {
          setHeaderVisible(delta < 0 || y < 80)
          lastScrollY.current = y
        }
        ticking = false
      })
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Close panels when clicking outside.
  useEffect(() => {
    if (!chapterMenuOpen && !settingsOpen) return
    function handleClick(e: MouseEvent) {
      const target = e.target as Element
      if (!target.closest("[data-reader-panel]") && !target.closest("[data-reader-trigger]")) {
        setChapterMenuOpen(false)
        setSettingsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [chapterMenuOpen, settingsOpen])

  // Debounced progress save.
  const saveProgress = useCallback(
    (pageNumber: number) => {
      if (!user) return
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => {
        userApi.saveProgress(manga.id, chapter.id, pageNumber).catch(() => {})
      }, 1500)
    },
    [user, manga.id, chapter.id]
  )

  // Scroll mode: track visible page via IntersectionObserver.
  useEffect(() => {
    if (mode !== "scroll") return
    const observers: IntersectionObserver[] = []
    pages.forEach((page) => {
      const el = document.getElementById(`page-${page.pageNumber}`)
      if (!el) return
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setCurrentPage(page.pageNumber)
            saveProgress(page.pageNumber)
          }
        },
        { threshold: 0.4 }
      )
      obs.observe(el)
      observers.push(obs)
    })
    return () => observers.forEach((o) => o.disconnect())
  }, [mode, pages, saveProgress])

  // Paginated mode: save on page change (debounce is inside saveProgress).
  useEffect(() => {
    if (mode !== "paginated") return
    saveProgress(currentPage)
    return () => {
      // Clear any pending save when page/mode changes.
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [mode, currentPage, saveProgress])

  // Keyboard navigation (paginated mode) — handles chapter boundaries.
  useEffect(() => {
    if (mode !== "paginated") return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        setCurrentPage((p) => {
          if (p >= totalPages && nextChapter) {
            router.push(`/manga/${manga.slug}/${nextChapter.id}`)
            return p
          }
          return Math.min(p + 1, totalPages)
        })
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        setCurrentPage((p) => {
          if (p <= 1 && prevChapter) {
            router.push(`/manga/${manga.slug}/${prevChapter.id}`)
            return p
          }
          return Math.max(p - 1, 1)
        })
      }
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [mode, totalPages, prevChapter, nextChapter, manga.slug, router])

  // Switch modes.
  // Switching scroll → paginated: keep the page the observer has already
  // tracked so the user continues from where they were in scroll mode.
  // Switching paginated → scroll: no reset needed; the scroll position is
  // wherever the browser left it.
  function switchMode(m: ReadMode) {
    setMode(m)
  }

  const currentPageData = pages.find((p) => p.pageNumber === currentPage)

  return (
    <div className="min-h-screen bg-[#0a0a0a] select-none">

      {/* ── Fixed header ──────────────────────────────────────────────────── */}
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-transform duration-200 ease-out",
          headerVisible ? "translate-y-0" : "-translate-y-full"
        )}
      >
        <div className="flex items-center gap-2 px-3 py-2.5 bg-background/95 backdrop-blur-md border-b border-border">
          {/* Back + title */}
          <Link
            href={`/manga/${manga.slug}`}
            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors shrink-0 rounded-md hover:bg-card/60"
            aria-label="Back to manga"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground truncate leading-none">
              {manga.title}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
              Ch.{chapter.number}{chapter.title ? ` — ${chapter.title}` : ""}
            </p>
          </div>

          {/* Page counter */}
          <span className="text-xs text-muted-foreground tabular-nums shrink-0 px-2">
            {currentPage}&thinsp;/&thinsp;{totalPages}
          </span>

          {/* Controls */}
          <div className="flex items-center shrink-0">
            {/* Chapter list */}
            <button
              data-reader-trigger
              onClick={() => { setChapterMenuOpen(!chapterMenuOpen); setSettingsOpen(false) }}
              className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-card/60"
              aria-label="Chapter list"
              aria-expanded={chapterMenuOpen}
            >
              <Menu className="size-4" />
            </button>
            {/* Settings */}
            <button
              data-reader-trigger
              onClick={() => { setSettingsOpen(!settingsOpen); setChapterMenuOpen(false) }}
              className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-card/60"
              aria-label="Reader settings"
              aria-expanded={settingsOpen}
            >
              <Settings className="size-4" />
            </button>
          </div>
        </div>

        {/* Settings panel */}
        {settingsOpen && (
          <div
            data-reader-panel
            className="flex flex-wrap items-center gap-3 px-4 py-2.5 bg-card border-b border-border"
          >
            <span className="text-xs text-muted-foreground">Reading mode</span>
            <div className="flex items-center gap-0.5 p-0.5 rounded-md bg-background border border-border">
              <button
                onClick={() => switchMode("scroll")}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors",
                  mode === "scroll"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <AlignJustify className="size-3" />
                Scroll
              </button>
              <button
                onClick={() => switchMode("paginated")}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors",
                  mode === "paginated"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <LayoutList className="size-3" />
                Pages
              </button>
            </div>
            {!user && (
              <span className="text-[10px] text-muted-foreground/60">
                Sign in to save progress
              </span>
            )}
          </div>
        )}

        {/* Chapter list panel */}
        {chapterMenuOpen && (
          <div
            data-reader-panel
            className="absolute top-full right-0 w-60 max-h-80 overflow-y-auto bg-popover border border-border rounded-bl-md shadow-2xl"
          >
            <div className="flex items-center justify-between px-3 py-2 border-b border-border sticky top-0 bg-popover">
              <span className="text-xs font-medium text-foreground">All Chapters</span>
              <button
                onClick={() => setChapterMenuOpen(false)}
                className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Close chapter list"
              >
                <X className="size-3.5" />
              </button>
            </div>
            {sortedChapters.length === 0 ? (
              <p className="px-3 py-4 text-xs text-muted-foreground text-center">No chapters.</p>
            ) : (
              sortedChapters.map((ch) => (
                <Link
                  key={ch.id}
                  href={`/manga/${manga.slug}/${ch.id}`}
                  onClick={() => setChapterMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2.5 text-xs hover:bg-card transition-colors border-b border-border/50 last:border-0",
                    ch.id === chapter.id
                      ? "text-primary bg-primary/5"
                      : "text-muted-foreground"
                  )}
                >
                  <BookOpen className="size-3 shrink-0" />
                  <span className="font-medium tabular-nums">Ch.{ch.number}</span>
                  {ch.title && (
                    <span className="truncate text-foreground/50">{ch.title}</span>
                  )}
                </Link>
              ))
            )}
          </div>
        )}
      </header>

      {/* ── Reader body ───────────────────────────────────────────────────── */}
      <div className="pt-11">
        {mode === "scroll" ? (
          <ScrollReader
            pages={pages}
            manga={manga}
            prevChapter={prevChapter}
            nextChapter={nextChapter}
          />
        ) : (
          <PaginatedReader
            pages={pages}
            currentPage={currentPage}
            totalPages={totalPages}
            manga={manga}
            prevChapter={prevChapter}
            nextChapter={nextChapter}
            onPageChange={setCurrentPage}
          />
        )}
      </div>
    </div>
  )
}

/* ── Scroll mode ──────────────────────────────────────────────────────────── */

function ScrollPage({ page }: { page: ChapterWithPages["pages"][number] }) {
  const [loaded, setLoaded] = useState(false)
  const [errored, setErrored] = useState(false)
  const aspectStyle = page.width && page.height
    ? { aspectRatio: `${page.width} / ${page.height}` }
    : { minHeight: "60vh" }

  return (
    <div
      id={`page-${page.pageNumber}`}
      className="relative w-full max-w-2xl"
      style={aspectStyle}
    >
      {!loaded && !errored && (
        <div className="absolute inset-0 bg-card animate-pulse" aria-hidden="true" />
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={page.imageUrl}
        alt={`Page ${page.pageNumber}`}
        width={page.width}
        height={page.height}
        className={cn("w-full h-auto transition-opacity duration-300", loaded ? "opacity-100" : "opacity-0")}
        loading={page.pageNumber <= 3 ? "eager" : "lazy"}
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => { setLoaded(true); setErrored(true) }}
      />
      {errored && (
        <div className="absolute inset-0 flex items-center justify-center bg-card text-muted-foreground/40 text-xs">
          Page {page.pageNumber} failed to load
        </div>
      )}
    </div>
  )
}

function ScrollReader({
  pages,
  manga,
  prevChapter,
  nextChapter,
}: {
  pages: ChapterWithPages["pages"]
  manga: Manga
  prevChapter: Chapter | null
  nextChapter: Chapter | null
}) {
  return (
    <div className="flex flex-col items-center">
      {pages.map((page) => (
        <ScrollPage key={page.id} page={page} />
      ))}

      {/* Chapter navigation at bottom */}
      <div className="flex items-center justify-between gap-4 w-full max-w-2xl px-4 py-8 border-t border-border mt-2">
        <div className="flex-1 flex justify-start">
          {prevChapter && (
            <Link
              href={`/manga/${manga.slug}/${prevChapter.id}`}
              className="flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
            >
              <ChevronLeft className="size-4" />
              Ch.{prevChapter.number}
            </Link>
          )}
        </div>
        <Link
          href={`/manga/${manga.slug}`}
          className="text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          All chapters
        </Link>
        <div className="flex-1 flex justify-end">
          {nextChapter && (
            <Link
              href={`/manga/${manga.slug}/${nextChapter.id}`}
              className="flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
            >
              Ch.{nextChapter.number}
              <ChevronRight className="size-4" />
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Paginated mode ───────────────────────────────────────────────────────── */

function PaginatedPage({ page }: { page: ChapterWithPages["pages"][number] }) {
  const [loaded, setLoaded] = useState(false)
  const [errored, setErrored] = useState(false)
  const aspectStyle =
    page.width && page.height
      ? { aspectRatio: `${page.width} / ${page.height}` }
      : { minHeight: "70vh" }

  return (
    <div className="relative w-full max-w-2xl" style={aspectStyle}>
      {!loaded && !errored && (
        <div className="absolute inset-0 bg-card animate-pulse" aria-hidden="true" />
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={page.imageUrl}
        alt={`Page ${page.pageNumber}`}
        width={page.width}
        height={page.height}
        className={cn(
          "w-full h-auto object-contain max-h-[calc(100vh-7.5rem)] transition-opacity duration-200",
          loaded ? "opacity-100" : "opacity-0"
        )}
        loading="eager"
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => {
          setLoaded(true)
          setErrored(true)
        }}
      />
      {errored && (
        <div className="absolute inset-0 flex items-center justify-center bg-card text-muted-foreground/40 text-xs">
          Page {page.pageNumber} failed to load
        </div>
      )}
    </div>
  )
}

function PaginatedReader({
  pages,
  currentPage,
  totalPages,
  manga,
  prevChapter,
  nextChapter,
  onPageChange,
}: {
  pages: ChapterWithPages["pages"]
  currentPage: number
  totalPages: number
  manga: Manga
  prevChapter: Chapter | null
  nextChapter: Chapter | null
  onPageChange: (p: number) => void
}) {
  const pageData = pages.find((p) => p.pageNumber === currentPage)
  const atFirst = currentPage === 1
  const atLast = currentPage === totalPages

  return (
    <>
      {/* Full-viewport image area */}
      <div
        className="flex items-center justify-center"
        style={{ minHeight: "calc(100vh - 2.75rem - 3.5rem)" }}
      >
        {pageData && (
          <div className="relative w-full max-w-2xl px-0">
            {/* PaginatedPage is keyed by id so its loaded state resets on every page turn */}
            <PaginatedPage key={pageData.id} page={pageData} />
            {/* Left tap zone: go to previous page, or previous chapter when on page 1 */}
            {atFirst && prevChapter ? (
              <Link
                href={`/manga/${manga.slug}/${prevChapter.id}`}
                className="absolute inset-y-0 left-0 w-1/3"
                aria-label={`Previous chapter: Ch.${prevChapter.number}`}
                tabIndex={-1}
              />
            ) : (
              <button
                onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
                disabled={atFirst}
                className="absolute inset-y-0 left-0 w-1/3 cursor-w-resize focus:outline-none disabled:cursor-default"
                aria-label="Previous page"
                tabIndex={-1}
              />
            )}
            {/* Right tap zone: go to next page, or next chapter when on last page */}
            {atLast && nextChapter ? (
              <Link
                href={`/manga/${manga.slug}/${nextChapter.id}`}
                className="absolute inset-y-0 right-0 w-2/3"
                aria-label={`Next chapter: Ch.${nextChapter.number}`}
                tabIndex={-1}
              />
            ) : (
              <button
                onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
                disabled={atLast && !nextChapter}
                className="absolute inset-y-0 right-0 w-2/3 cursor-e-resize focus:outline-none disabled:cursor-default"
                aria-label="Next page"
                tabIndex={-1}
              />
            )}
          </div>
        )}
      </div>

      {/* Fixed bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 flex items-center gap-3 px-4 py-2.5 bg-background/95 backdrop-blur-md border-t border-border z-40">
        {/* Prev: go to prev chapter if at page 1, else prev page */}
        {atFirst && prevChapter ? (
          <Link
            href={`/manga/${manga.slug}/${prevChapter.id}`}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            <ChevronLeft className="size-4" />
            <span className="hidden sm:inline">Ch.{prevChapter.number}</span>
          </Link>
        ) : (
          <button
            onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
            disabled={atFirst}
            className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-25 transition-colors shrink-0"
            aria-label="Previous page"
          >
            <ChevronLeft className="size-5" />
          </button>
        )}

        {/* Slider */}
        <input
          type="range"
          min={1}
          max={totalPages}
          value={currentPage}
          onChange={(e) => onPageChange(Number(e.target.value))}
          className="flex-1 accent-[oklch(0.72_0.17_62)] cursor-pointer h-1"
          aria-label="Page slider"
        />

        {/* Next: go to next chapter if at last page, else next page */}
        {atLast && nextChapter ? (
          <Link
            href={`/manga/${manga.slug}/${nextChapter.id}`}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            <span className="hidden sm:inline">Ch.{nextChapter.number}</span>
            <ChevronRight className="size-4" />
          </Link>
        ) : (
          <button
            onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
            disabled={atLast}
            className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-25 transition-colors shrink-0"
            aria-label="Next page"
          >
            <ChevronRight className="size-5" />
          </button>
        )}
      </div>
    </>
  )
}
