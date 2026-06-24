"use client"

import { useState, useEffect, useRef, useMemo, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import {
  Search,
  X,
  SlidersHorizontal,
  ChevronDown,
  RotateCcw,
  ArrowUpDown,
} from "lucide-react"
import useSWR from "swr"
import { Navbar } from "@/components/navbar"
import { MangaCard } from "@/components/manga-card"
import { manga as mangaApi } from "@/lib/api"
import type { Manga } from "@/lib/types"
import { cn } from "@/lib/utils"

// ── constants ─────────────────────────────────────────────────────────────────

const TYPES    = ["manga", "manhwa", "manhua", "webtoon"] as const
const STATUSES = ["ongoing", "completed", "hiatus", "cancelled"] as const

const TYPE_LABELS: Record<string, string> = {
  manga:   "Manga",
  manhwa:  "Manhwa",
  manhua:  "Manhua",
  webtoon: "Webtoon",
}

const STATUS_LABELS: Record<string, string> = {
  ongoing:   "Ongoing",
  completed: "Completed",
  hiatus:    "Hiatus",
  cancelled: "Cancelled",
}

const SORT_OPTIONS = [
  { value: "views-desc", label: "Most Viewed" },
  { value: "views-asc",  label: "Least Viewed" },
  { value: "az",         label: "A \u2013 Z" },
  { value: "za",         label: "Z \u2013 A" },
  { value: "newest",     label: "Newest" },
  { value: "oldest",     label: "Oldest" },
] as const

type SortValue  = typeof SORT_OPTIONS[number]["value"]
type FilterMode = "OR" | "AND"

const PAGE_SIZE = 24

// ── helpers ───────────────────────────────────────────────────────────────────

function sortResults(items: Manga[], sort: SortValue): Manga[] {
  const arr = [...items]
  switch (sort) {
    case "views-desc": return arr.sort((a, b) => b.viewCount - a.viewCount)
    case "views-asc":  return arr.sort((a, b) => a.viewCount - b.viewCount)
    case "az":         return arr.sort((a, b) => a.title.localeCompare(b.title))
    case "za":         return arr.sort((a, b) => b.title.localeCompare(a.title))
    case "newest":     return arr.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    case "oldest":     return arr.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  }
}

function setToParam(s: Set<string>): string { return [...s].sort().join(",") }
function paramToSet(p: string | null): Set<string> {
  if (!p) return new Set()
  return new Set(p.split(",").filter(Boolean))
}

// ── SWR key ───────────────────────────────────────────────────────────────────

function buildKey(
  query: string,
  types: Set<string>,
  statuses: Set<string>,
  typeMode: FilterMode,
  statusMode: FilterMode,
  page: number,
): string | null {
  if (!query && types.size === 0 && statuses.size === 0) return null
  return JSON.stringify({
    query,
    types:    setToParam(types),
    statuses: setToParam(statuses),
    typeMode,
    statusMode,
    page,
  })
}

// ── fetch logic ───────────────────────────────────────────────────────────────
//
// The backend API accepts a single `type` and single `status` per request.
// We implement multi-select semantics entirely on the client by fanning out
// requests and then merging results.
//
// OR  mode  — union:        result must appear in AT LEAST ONE request
// AND mode  — intersection: result must appear in ALL requests
//
// To keep the request count manageable we deduplicate identical (type, status)
// combinations before firing and cache results within a single call.
//
// Correct OR semantics when both dimensions have values:
//   "Manhwa OR Webtoon" + "Ongoing OR Completed"
//   = all manhwa + all webtoon + all ongoing + all completed   (union)
//   NOT cartesian product (that would be AND between dimensions)

type RequestParams = { type?: string; status?: string }

async function fetchSearch(
  query: string,
  types: Set<string>,
  statuses: Set<string>,
  typeMode: FilterMode,
  statusMode: FilterMode,
  page: number,
): Promise<Manga[]> {
  // Build the list of API calls to make.
  let paramSets: RequestParams[]

  const typeList   = types.size   > 0 ? [...types]    : []
  const statusList = statuses.size > 0 ? [...statuses] : []

  if (typeMode === "AND" && statusMode === "AND" && typeList.length > 0 && statusList.length > 0) {
    // AND × AND — every type AND every status must match.
    // Fire one request per (type, status) pair; intersect results.
    paramSets = typeList.flatMap(t => statusList.map(s => ({ type: t, status: s })))
  } else if (typeMode === "AND" && typeList.length > 1) {
    // Multiple types with AND — impossible for a single-value API; return empty
    // (a title cannot be both "manga" AND "manhwa" at the same time).
    return []
  } else if (statusMode === "AND" && statusList.length > 1) {
    // Multiple statuses with AND — same impossibility.
    return []
  } else {
    // OR mode (default): fire one request per dimension value and union results.
    // Merge type-only requests + status-only requests to avoid the cartesian product.
    const set: RequestParams[] = []

    if (typeList.length > 0 && statusList.length === 0) {
      typeList.forEach(t => set.push({ type: t }))
    } else if (statusList.length > 0 && typeList.length === 0) {
      statusList.forEach(s => set.push({ status: s }))
    } else if (typeList.length > 0 && statusList.length > 0) {
      // Both selected in OR mode: union across each type (no status constraint)
      // plus each status (no type constraint) gives the broadest OR union.
      typeList.forEach(t   => set.push({ type: t }))
      statusList.forEach(s => set.push({ status: s }))
    } else {
      // No type/status — plain text search
      set.push({})
    }

    paramSets = set
  }

  // De-duplicate identical param combos (can happen in edge cases).
  const seen = new Set<string>()
  const unique = paramSets.filter(p => {
    const k = `${p.type ?? ""}:${p.status ?? ""}`
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })

  // Fire all requests in parallel.
  const arrays = await Promise.all(
    unique.map(p =>
      mangaApi
        .list({
          page,
          limit: PAGE_SIZE + 1,
          search: query || undefined,
          type:   p.type,
          status: p.status,
        })
        .then(r => r.data ?? [])
        .catch(() => [] as Manga[])
    )
  )

  // AND intersection — keep only items present in every response array.
  const isAndMode =
    typeMode === "AND" && statusMode === "AND" &&
    typeList.length > 0 && statusList.length > 0

  if (isAndMode && arrays.length > 1) {
    const idSets = arrays.map(arr => new Set(arr.map(m => m.id)))
    const intersection = idSets.reduce((acc, s) => {
      const next = new Set<string>()
      for (const id of acc) if (s.has(id)) next.add(id)
      return next
    })
    return arrays[0].filter(m => intersection.has(m.id))
  }

  // OR union — merge all arrays, deduplicate by id.
  const seenIds = new Set<string>()
  const merged: Manga[] = []
  for (const arr of arrays) {
    for (const item of arr) {
      if (!seenIds.has(item.id)) {
        seenIds.add(item.id)
        merged.push(item)
      }
    }
  }
  return merged
}

// ── page shell ────────────────────────────────────────────────────────────────

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchSkeleton />}>
      <SearchContent />
    </Suspense>
  )
}

function SearchSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8 space-y-6">
        <div className="flex gap-2">
          <div className="h-11 flex-1 rounded-lg bg-card animate-pulse" />
          <div className="h-11 w-28 rounded-lg bg-card animate-pulse" />
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4">
          {Array.from({ length: 18 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <div className="aspect-[2/3] rounded-md bg-card animate-pulse" />
              <div className="h-3 rounded bg-card animate-pulse w-3/4" />
              <div className="h-3 rounded bg-card animate-pulse w-1/2" />
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}

// ── main search UI ────────────────────────────────────────────────────────────

function SearchContent() {
  const searchParams = useSearchParams()
  const router       = useRouter()

  // ── state (initialised from URL) ──────────────────────────────────────────
  const [query,         setQuery]         = useState(searchParams.get("q") ?? "")
  const [debouncedQ,    setDebouncedQ]    = useState(query)
  const [selectedTypes,    setSelectedTypes]    = useState<Set<string>>(() => paramToSet(searchParams.get("types")))
  const [selectedStatuses, setSelectedStatuses] = useState<Set<string>>(() => paramToSet(searchParams.get("statuses")))
  const [typeMode,      setTypeMode]      = useState<FilterMode>((searchParams.get("tm") as FilterMode) ?? "OR")
  const [statusMode,    setStatusMode]    = useState<FilterMode>((searchParams.get("sm") as FilterMode) ?? "OR")
  const [sort,          setSort]          = useState<SortValue>((searchParams.get("sort") as SortValue) ?? "views-desc")
  const [page,          setPage]          = useState(Number(searchParams.get("page") ?? 1))
  const [panelOpen,     setPanelOpen]     = useState(false)
  const [sortOpen,      setSortOpen]      = useState(false)

  const inputRef  = useRef<HTMLInputElement>(null)
  const sortRef   = useRef<HTMLDivElement>(null)
  const didMount  = useRef(false)

  // ── debounce query ────────────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(query), 350)
    return () => clearTimeout(t)
  }, [query])

  // ── reset page on any filter change ──────────────────────────────────────
  useEffect(() => { setPage(1) }, [debouncedQ, selectedTypes, selectedStatuses, typeMode, statusMode])

  // ── sync URL (skip initial mount) ────────────────────────────────────────
  useEffect(() => {
    if (!didMount.current) { didMount.current = true; return }
    const p = new URLSearchParams()
    if (debouncedQ)                p.set("q",        debouncedQ)
    if (selectedTypes.size > 0)    p.set("types",    setToParam(selectedTypes))
    if (selectedStatuses.size > 0) p.set("statuses", setToParam(selectedStatuses))
    if (typeMode   !== "OR")       p.set("tm",       typeMode)
    if (statusMode !== "OR")       p.set("sm",       statusMode)
    if (sort !== "views-desc")     p.set("sort",     sort)
    if (page > 1)                  p.set("page",     String(page))
    router.replace(`/search?${p.toString()}`, { scroll: false })
  }, [debouncedQ, selectedTypes, selectedStatuses, typeMode, statusMode, sort, page, router])

  // ── close sort dropdown on outside click ─────────────────────────────────
  useEffect(() => {
    if (!sortOpen) return
    function handler(e: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [sortOpen])

  // ── "/" shortcut to focus this page's search input ────────────────────────
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key !== "/" || e.ctrlKey || e.metaKey || e.altKey) return
      const tag = (e.target as HTMLElement).tagName
      if (tag === "INPUT" || tag === "TEXTAREA") return
      e.preventDefault()
      inputRef.current?.focus()
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [])

  // ── SWR ───────────────────────────────────────────────────────────────────
  const swrKey = buildKey(debouncedQ, selectedTypes, selectedStatuses, typeMode, statusMode, page)

  const { data: rawResults, isLoading, error } = useSWR<Manga[]>(
    swrKey,
    () => fetchSearch(debouncedQ, selectedTypes, selectedStatuses, typeMode, statusMode, page),
    { keepPreviousData: true }
  )

  // ── derive paginated + sorted results ─────────────────────────────────────
  const hasNextPage  = (rawResults?.length ?? 0) > PAGE_SIZE
  const pageSlice    = rawResults ? (hasNextPage ? rawResults.slice(0, PAGE_SIZE) : rawResults) : []
  const results      = useMemo(() => sortResults(pageSlice, sort), [pageSlice, sort])

  // ── filter helpers ────────────────────────────────────────────────────────
  function toggleType(t: string) {
    setSelectedTypes(prev => {
      const next = new Set(prev)
      next.has(t) ? next.delete(t) : next.add(t)
      return next
    })
  }

  function toggleStatus(s: string) {
    setSelectedStatuses(prev => {
      const next = new Set(prev)
      next.has(s) ? next.delete(s) : next.add(s)
      return next
    })
  }

  function clearAll() {
    setQuery("")
    setSelectedTypes(new Set())
    setSelectedStatuses(new Set())
    setTypeMode("OR")
    setStatusMode("OR")
    setSort("views-desc")
    setPage(1)
  }

  // ── derived UI values ─────────────────────────────────────────────────────
  const hasFilters = debouncedQ || selectedTypes.size > 0 || selectedStatuses.size > 0
  const activeFilterCount = selectedTypes.size + selectedStatuses.size

  const activeChips: { label: string; group: string; onRemove: () => void }[] = []
  for (const t of selectedTypes)
    activeChips.push({ label: TYPE_LABELS[t] ?? t,   group: "type",   onRemove: () => toggleType(t) })
  for (const s of selectedStatuses)
    activeChips.push({ label: STATUS_LABELS[s] ?? s, group: "status", onRemove: () => toggleStatus(s) })

  const currentSortLabel = SORT_OPTIONS.find(o => o.value === sort)?.label ?? "Sort"

  // Result count string
  const resultLabel = (() => {
    if (!swrKey) return ""
    if (isLoading && !rawResults) return ""
    if (results.length === 0) return ""
    const base = `${results.length}${hasNextPage ? "+" : ""} result${results.length !== 1 ? "s" : ""}`
    return page > 1 ? `${base} — page ${page}` : base
  })()

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8 space-y-4">

        {/* ── Page header ─────────────────────────────────────────────── */}
        <div className="mb-2">
          <h1 className="text-xl font-semibold text-foreground tracking-tight">Advanced Search</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Filter by type, status, and combine conditions with AND / OR logic.
          </p>
        </div>

        {/* ── Search bar ──────────────────────────────────────────────── */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={`Search titles, authors\u2026  (press / to focus)`}
              autoFocus
              className="h-11 w-full rounded-lg border border-border bg-card pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
              aria-label="Search manga"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Clear search"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          {/* Filter panel toggle */}
          <button
            onClick={() => setPanelOpen(v => !v)}
            className={cn(
              "flex items-center gap-2 h-11 px-4 rounded-lg border text-sm font-medium transition-colors shrink-0",
              panelOpen
                ? "border-primary/60 bg-primary/10 text-primary"
                : "border-border bg-card text-muted-foreground hover:text-foreground hover:border-primary/30"
            )}
            aria-expanded={panelOpen}
            aria-label="Toggle advanced filters"
          >
            <SlidersHorizontal className="size-4" />
            <span className="hidden sm:inline">Filters</span>
            {activeFilterCount > 0 && (
              <span className="flex items-center justify-center size-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold leading-none">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* ── Filter panel ────────────────────────────────────────────── */}
        {panelOpen && (
          <div className="rounded-lg border border-border bg-card p-5 space-y-5">

            {/* Type */}
            <FilterGroup
              label="Type"
              hint="Format of the comic"
              mode={typeMode}
              onModeChange={setTypeMode}
              modeDisabled={selectedTypes.size <= 1}
            >
              {TYPES.map(t => (
                <FilterChip
                  key={t}
                  label={TYPE_LABELS[t]}
                  active={selectedTypes.has(t)}
                  onClick={() => toggleType(t)}
                />
              ))}
            </FilterGroup>

            <div className="border-t border-border/60" />

            {/* Status */}
            <FilterGroup
              label="Status"
              hint="Publication status"
              mode={statusMode}
              onModeChange={setStatusMode}
              modeDisabled={selectedStatuses.size <= 1}
            >
              {STATUSES.map(s => (
                <FilterChip
                  key={s}
                  label={STATUS_LABELS[s]}
                  active={selectedStatuses.has(s)}
                  onClick={() => toggleStatus(s)}
                />
              ))}
            </FilterGroup>

            {/* AND / OR cross-dimension explanation */}
            {selectedTypes.size > 0 && selectedStatuses.size > 0 && (
              <div className="rounded-md bg-background border border-border/60 px-3 py-2 text-[11px] text-muted-foreground">
                <span className="font-medium text-foreground">How filters combine: </span>
                {typeMode === "OR"
                  ? `Type (${[...selectedTypes].map(t => TYPE_LABELS[t]).join(" or ")})`
                  : `Type (${[...selectedTypes].map(t => TYPE_LABELS[t]).join(" and ")})`}
                {" + "}
                {statusMode === "OR"
                  ? `Status (${[...selectedStatuses].map(s => STATUS_LABELS[s]).join(" or ")})`
                  : `Status (${[...selectedStatuses].map(s => STATUS_LABELS[s]).join(" and ")})`}
              </div>
            )}

            {/* Reset */}
            {hasFilters && (
              <button
                onClick={clearAll}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                <RotateCcw className="size-3" />
                Reset all filters
              </button>
            )}
          </div>
        )}

        {/* ── Active chips + sort bar ──────────────────────────────────── */}
        {(activeChips.length > 0 || hasFilters) && (
          <div className="flex flex-wrap items-center gap-2 min-h-[1.75rem]">

            {/* Query chip */}
            {debouncedQ && (
              <span className="flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1 text-xs text-foreground">
                <Search className="size-3 text-muted-foreground" aria-hidden="true" />
                {debouncedQ}
                <button
                  onClick={() => setQuery("")}
                  className="text-muted-foreground hover:text-foreground transition-colors ml-0.5"
                  aria-label="Remove search query"
                >
                  <X className="size-3" />
                </button>
              </span>
            )}

            {/* Filter chips grouped by type / status */}
            {activeChips.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                {activeChips.map(chip => (
                  <span
                    key={`${chip.group}-${chip.label}`}
                    className="flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs text-primary"
                  >
                    {chip.label}
                    <button
                      onClick={chip.onRemove}
                      className="text-primary/60 hover:text-primary transition-colors ml-0.5"
                      aria-label={`Remove ${chip.label} filter`}
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Clear all — only when multiple active */}
            {activeChips.length > 1 && (
              <button
                onClick={clearAll}
                className="text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                Clear all
              </button>
            )}

            {/* Sort dropdown — always right-aligned when search is active */}
            <div ref={sortRef} className="relative ml-auto">
              <button
                onClick={() => setSortOpen(v => !v)}
                className="flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
                aria-label="Change sort order"
              >
                <ArrowUpDown className="size-3" />
                {currentSortLabel}
                <ChevronDown className={cn("size-3 transition-transform", sortOpen && "rotate-180")} />
              </button>
              {sortOpen && (
                <div className="absolute right-0 top-[calc(100%+4px)] z-50 w-40 rounded-md border border-border bg-popover shadow-xl py-1">
                  {SORT_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => { setSort(opt.value); setSortOpen(false) }}
                      className={cn(
                        "w-full px-3 py-2 text-left text-xs transition-colors hover:bg-card",
                        sort === opt.value
                          ? "text-primary font-medium"
                          : "text-muted-foreground"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Results area ────────────────────────────────────────────── */}
        {!swrKey ? (
          /* Empty state */
          <EmptyPrompt />
        ) : isLoading && !rawResults ? (
          /* Initial loading skeleton */
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4">
            {Array.from({ length: PAGE_SIZE }).map((_, i) => (
              <div key={i} className="flex flex-col gap-2">
                <div className="aspect-[2/3] rounded-md bg-card animate-pulse" />
                <div className="h-3 rounded bg-card animate-pulse w-3/4" />
                <div className="h-3 rounded bg-card animate-pulse w-1/2" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="py-20 flex flex-col items-center gap-3 text-center">
            <p className="text-muted-foreground text-sm">Something went wrong. Please try again.</p>
            <button onClick={clearAll} className="text-xs text-primary hover:underline">
              Reset and try again
            </button>
          </div>
        ) : results.length === 0 ? (
          <div className="py-20 flex flex-col items-center gap-4 text-center">
            <div className="size-14 rounded-full border border-border flex items-center justify-center">
              <Search className="size-6 text-muted-foreground/30" />
            </div>
            <div className="space-y-1">
              <p className="text-foreground font-medium">No results found</p>
              <p className="text-sm text-muted-foreground">Try a different query or remove some filters.</p>
            </div>
            {hasFilters && (
              <button onClick={clearAll} className="text-xs text-primary hover:underline">
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className={cn("space-y-4", isLoading && "opacity-60 pointer-events-none transition-opacity")}>

            {/* Result count */}
            {resultLabel && (
              <p className="text-xs text-muted-foreground">{resultLabel}</p>
            )}

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4">
              {results.map(item => (
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
            {(page > 1 || hasNextPage) && (
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: "smooth" }) }}
                  disabled={page === 1}
                  className="px-4 py-2 rounded-md border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <span className="text-sm text-muted-foreground tabular-nums">Page {page}</span>
                <button
                  onClick={() => { setPage(p => p + 1); window.scrollTo({ top: 0, behavior: "smooth" }) }}
                  disabled={!hasNextPage}
                  className="px-4 py-2 rounded-md border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

// ── sub-components ────────────────────────────────────────────────────────────

function EmptyPrompt() {
  return (
    <div className="py-24 flex flex-col items-center gap-5 text-center select-none">
      <div className="size-16 rounded-full border border-border flex items-center justify-center">
        <Search className="size-7 text-muted-foreground/30" aria-hidden="true" />
      </div>
      <div className="space-y-1.5 max-w-xs">
        <p className="text-foreground font-medium text-balance">Find your next read</p>
        <p className="text-sm text-muted-foreground text-balance">
          Type a title or author name, or open the Filters panel to search by type and
          status with AND / OR combinations.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground/50">
        <kbd className="rounded border border-border/60 px-1.5 py-0.5 font-mono text-[10px]">/</kbd>
        <span>to focus search</span>
      </div>
    </div>
  )
}

function FilterGroup({
  label,
  hint,
  mode,
  onModeChange,
  modeDisabled,
  children,
}: {
  label: string
  hint?: string
  mode: FilterMode
  onModeChange: (m: FilterMode) => void
  modeDisabled?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-foreground">
            {label}
          </span>
          {hint && (
            <span className="ml-2 text-[11px] text-muted-foreground/60">{hint}</span>
          )}
        </div>
        <ModeToggle mode={mode} onChange={onModeChange} disabled={modeDisabled} />
      </div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  )
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all",
        active
          ? "border-primary bg-primary/15 text-primary shadow-sm"
          : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground hover:bg-card/50"
      )}
    >
      {label}
    </button>
  )
}

function ModeToggle({
  mode,
  onChange,
  disabled,
}: {
  mode: FilterMode
  onChange: (m: FilterMode) => void
  disabled?: boolean
}) {
  return (
    <div
      className={cn(
        "flex items-center rounded-md border border-border overflow-hidden",
        disabled && "opacity-35 pointer-events-none"
      )}
      title={disabled ? "Select 2 or more items to switch mode" : undefined}
      aria-label="Filter combination mode"
    >
      {(["OR", "AND"] as FilterMode[]).map((m, i) => (
        <button
          key={m}
          onClick={() => onChange(m)}
          className={cn(
            "px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors",
            i > 0 && "border-l border-border",
            mode === m
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-card"
          )}
        >
          {m}
        </button>
      ))}
    </div>
  )
}
