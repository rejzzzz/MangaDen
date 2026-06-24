"use client"

import { useState, useEffect, useRef, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Search, SlidersHorizontal, X } from "lucide-react"
import useSWR from "swr"
import { Navbar } from "@/components/navbar"
import { MangaCard } from "@/components/manga-card"
import { manga as mangaApi } from "@/lib/api"
import type { Manga } from "@/lib/types"

const TYPES = ["", "manga", "manhwa", "manhua", "webtoon"] as const
const STATUSES = ["", "ongoing", "completed", "hiatus", "cancelled"] as const

const TYPE_LABELS: Record<string, string> = {
  "": "All Types",
  manga: "Manga",
  manhwa: "Manhwa",
  manhua: "Manhua",
  webtoon: "Webtoon",
}

const STATUS_LABELS: Record<string, string> = {
  "": "All Status",
  ongoing: "Ongoing",
  completed: "Completed",
  hiatus: "Hiatus",
  cancelled: "Cancelled",
}

export default function BrowsePage() {
  return (
    <Suspense fallback={<BrowseSkeleton />}>
      <BrowseContent />
    </Suspense>
  )
}

function BrowseSkeleton() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <div className="h-8 w-24 rounded bg-card animate-pulse mb-6" />
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4">
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <div className="aspect-[2/3] rounded-md bg-card animate-pulse" />
              <div className="h-3 rounded bg-card animate-pulse w-3/4" />
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}

function BrowseContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [search, setSearch] = useState(searchParams.get("search") ?? "")
  const [debouncedSearch, setDebouncedSearch] = useState(search)
  const [type, setType] = useState(searchParams.get("type") ?? "")
  const [status, setStatus] = useState(searchParams.get("status") ?? "")
  const [page, setPage] = useState(1)
  const [filtersOpen, setFiltersOpen] = useState(false)

  // Guard to skip the initial URL sync on mount (params are already in the URL).
  const didMount = useRef(false)

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400)
    return () => clearTimeout(t)
  }, [search])

  // Reset page on filter change
  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, type, status])

  // Sync URL params — skip the first render to avoid a spurious replace.
  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true
      return
    }
    const params = new URLSearchParams()
    if (debouncedSearch) params.set("search", debouncedSearch)
    if (type) params.set("type", type)
    if (status) params.set("status", status)
    router.replace(`/browse?${params.toString()}`, { scroll: false })
  }, [debouncedSearch, type, status, router])

  // Fetch one extra item (PAGE_SIZE + 1) to detect whether a next page exists
  // without needing a total count from the API.
  const PAGE_SIZE = 24
  const { data, isLoading } = useSWR(
    ["browse", page, debouncedSearch, type, status],
    () =>
      mangaApi.list({
        page,
        limit: PAGE_SIZE + 1,
        search: debouncedSearch || undefined,
        type: type || undefined,
        status: status || undefined,
      })
  )

  const raw: Manga[] = data?.data ?? []
  const hasNextPage = raw.length > PAGE_SIZE
  const results: Manga[] = hasNextPage ? raw.slice(0, PAGE_SIZE) : raw
  const hasFilters = debouncedSearch || type || status

  function clearFilters() {
    setSearch("")
    setType("")
    setStatus("")
    setPage(1)
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h1 className="text-xl font-semibold text-foreground">Browse</h1>

          {/* Search + filter toggle */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search titles..."
                className="h-9 w-full rounded-md border border-border bg-card pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className="flex items-center gap-1.5 h-9 rounded-md border border-border bg-card px-3 text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
            >
              <SlidersHorizontal className="size-3.5" />
              <span className="hidden sm:inline">Filter</span>
            </button>
          </div>
        </div>

        {/* Filter row */}
        {filtersOpen && (
          <div className="flex flex-wrap items-center gap-2 mb-6 p-3 rounded-md bg-card border border-border">
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              aria-label="Filter by type"
              className="h-8 rounded border border-border bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {TYPE_LABELS[t]}
                </option>
              ))}
            </select>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              aria-label="Filter by status"
              className="h-8 rounded border border-border bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                <X className="size-3" />
                Clear filters
              </button>
            )}
          </div>
        )}

        {/* Results */}
        {isLoading ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4">
            {Array.from({ length: 24 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-2">
                <div className="aspect-[2/3] rounded-md bg-card animate-pulse" />
                <div className="h-3 rounded bg-card animate-pulse w-3/4" />
              </div>
            ))}
          </div>
        ) : results.length > 0 ? (
          <>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4">
              {results.map((item) => (
                <MangaCard
                  key={item.id}
                  slug={item.slug}
                  title={item.title}
                  coverUrl={item.coverUrl}
                  type={item.type}
                  status={item.status}
                  viewCount={item.viewCount}
                />
              ))}
            </div>
            {/* Pagination */}
            <div className="flex items-center justify-center gap-3 mt-10">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 rounded-md border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <span className="text-sm text-muted-foreground">Page {page}</span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={!hasNextPage}
                className="px-4 py-2 rounded-md border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </>
        ) : (
          <div className="py-24 flex flex-col items-center gap-3 text-center">
            <Search className="size-10 text-muted-foreground/30" />
            <p className="text-muted-foreground text-sm">No results found.</p>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="text-xs text-primary hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
