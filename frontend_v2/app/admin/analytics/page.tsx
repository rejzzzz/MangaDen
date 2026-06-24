"use client"

import { useState } from "react"
import Link from "next/link"
import useSWR from "swr"
import { TrendingUp, Eye, UserPlus, Layers as LayersIcon } from "lucide-react"
import { SectionHeader, ApiNotice } from "@/components/admin/admin-ui"
import { adminAnalytics } from "@/lib/admin-api"
import { trending as trendingApi } from "@/lib/api"
import { cn } from "@/lib/utils"
import type { AnalyticsPoint } from "@/lib/admin-types"

const PERIODS: { value: "7d" | "30d" | "90d"; label: string }[] = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
]

const TYPE_COLORS: Record<string, string> = {
  manga: "bg-primary",
  manhwa: "bg-blue-400",
  manhua: "bg-green-400",
  webtoon: "bg-yellow-400",
}

export default function AdminAnalyticsPage() {
  const [period, setPeriod] = useState<"7d" | "30d" | "90d">("30d")

  const { data, error, isLoading } = useSWR(
    ["admin-analytics", period],
    () => adminAnalytics.get(period),
    { shouldRetryOnError: false, keepPreviousData: true }
  )

  const a = data?.data

  return (
    <div>
      <SectionHeader
        title="Analytics"
        description="Track views, growth, and catalog composition."
        action={
          <div className="flex items-center gap-1 rounded-md border border-border bg-card p-0.5">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={cn(
                  "rounded px-2.5 py-1 text-xs font-medium transition-colors",
                  period === p.value
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        }
      />

      {error && (
        <div className="mb-6">
          <ApiNotice message="The analytics endpoint (GET /api/admin/analytics) is not implemented yet, so charts below have no data. The 'Top Titles' panel uses live trending data. See ADMIN_API.md for the full analytics response shape." />
        </div>
      )}

      {/* Line charts */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <ChartCard
          title="Views over time"
          icon={Eye}
          loading={isLoading}
          points={a?.viewsOverTime}
          accent="var(--primary)"
        />
        <ChartCard
          title="New signups"
          icon={UserPlus}
          loading={isLoading}
          points={a?.signupsOverTime}
          accent="oklch(0.7 0.15 230)"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top titles — backed by live trending data */}
        <section className="rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="flex items-center gap-2 text-sm font-medium text-foreground">
              <TrendingUp className="size-4 text-primary" />
              Top Titles
            </h2>
          </div>
          <div className="p-4">
            <TopTitles period={period} fallback={a?.topManga} />
          </div>
        </section>

        {/* Catalog composition */}
        <section className="rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="flex items-center gap-2 text-sm font-medium text-foreground">
              <LayersIcon className="size-4 text-primary" />
              Catalog Composition
            </h2>
          </div>
          <div className="p-4 flex flex-col gap-6">
            <Breakdown
              label="By type"
              items={(a?.typeBreakdown ?? []).map((t) => ({ name: t.type, value: t.count, color: TYPE_COLORS[t.type] }))}
            />
            <Breakdown
              label="By status"
              items={(a?.statusBreakdown ?? []).map((s) => ({ name: s.status, value: s.count }))}
            />
            {!a && !isLoading && (
              <p className="text-xs text-muted-foreground text-center py-2">
                Composition data appears once the analytics endpoint is available.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Line chart (inline SVG)
// ---------------------------------------------------------------------------

function ChartCard({
  title,
  icon: Icon,
  points,
  loading,
  accent,
}: {
  title: string
  icon: typeof Eye
  points?: AnalyticsPoint[]
  loading?: boolean
  accent: string
}) {
  const data = points ?? []
  const total = data.reduce((sum, p) => sum + p.value, 0)

  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Icon className="size-4 text-primary" />
          {title}
        </h2>
        {data.length > 0 && (
          <span className="text-xs text-muted-foreground tabular-nums">
            {total.toLocaleString()} total
          </span>
        )}
      </div>
      {loading ? (
        <div className="h-40 rounded bg-background animate-pulse" />
      ) : data.length > 1 ? (
        <LineChart points={data} accent={accent} />
      ) : (
        <div className="h-40 rounded border border-dashed border-border flex items-center justify-center">
          <p className="text-xs text-muted-foreground">No data for this period.</p>
        </div>
      )}
    </section>
  )
}

function LineChart({ points, accent }: { points: AnalyticsPoint[]; accent: string }) {
  const W = 320
  const H = 140
  const PAD = 8
  const max = Math.max(...points.map((p) => p.value), 1)
  const stepX = (W - PAD * 2) / (points.length - 1)

  const coords = points.map((p, i) => {
    const x = PAD + i * stepX
    const y = H - PAD - (p.value / max) * (H - PAD * 2)
    return [x, y] as const
  })

  const linePath = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ")
  const areaPath = `${linePath} L${coords[coords.length - 1][0].toFixed(1)},${H - PAD} L${coords[0][0].toFixed(1)},${H - PAD} Z`

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-40" role="img" aria-label="Trend chart">
      <defs>
        <linearGradient id={`grad-${accent}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={accent} stopOpacity="0.25" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#grad-${accent})`} />
      <path d={linePath} fill="none" stroke={accent} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {coords.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="1.5" fill={accent} />
      ))}
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Breakdown bars
// ---------------------------------------------------------------------------

function Breakdown({
  label,
  items,
}: {
  label: string
  items: { name: string; value: number; color?: string }[]
}) {
  const total = items.reduce((s, i) => s + i.value, 0)
  if (items.length === 0) return null
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {items.map((item) => {
        const pct = total > 0 ? Math.round((item.value / total) * 100) : 0
        return (
          <div key={item.name} className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-xs">
              <span className="capitalize text-foreground">{item.name}</span>
              <span className="text-muted-foreground tabular-nums">
                {item.value.toLocaleString()} ({pct}%)
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-background overflow-hidden">
              <div
                className={cn("h-full rounded-full", item.color ?? "bg-primary")}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Top titles (live trending data, with optional analytics override)
// ---------------------------------------------------------------------------

function TopTitles({
  period,
  fallback,
}: {
  period: "7d" | "30d" | "90d"
  fallback?: { id: string; title: string; slug: string; views: number }[]
}) {
  // Map 90d → 30d for the trending endpoint (its max period).
  const trendingPeriod = period === "7d" ? "7d" : "30d"
  const { data, isLoading } = useSWR(
    ["analytics-top", trendingPeriod],
    () => trendingApi.get(trendingPeriod, 8),
    { shouldRetryOnError: false }
  )

  const items =
    fallback && fallback.length > 0
      ? fallback.map((f) => ({ id: f.id, title: f.title, slug: f.slug, viewCount: f.views }))
      : (data ?? []).map((m) => ({ id: m.id, title: m.title, slug: m.slug, viewCount: m.viewCount }))

  if (isLoading && items.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-9 rounded bg-background animate-pulse" />
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground py-6 text-center">No data.</p>
  }

  const max = Math.max(...items.map((i) => i.viewCount), 1)

  return (
    <ul className="flex flex-col gap-2.5">
      {items.map((m, i) => (
        <li key={m.id} className="flex items-center gap-3">
          <span className="text-xs font-semibold text-muted-foreground tabular-nums w-4 text-center shrink-0">
            {i + 1}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <Link href={`/manga/${m.slug}`} className="text-sm text-foreground hover:text-primary truncate transition-colors">
                {m.title}
              </Link>
              <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                {m.viewCount.toLocaleString()}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-background overflow-hidden">
              <div className="h-full rounded-full bg-primary" style={{ width: `${(m.viewCount / max) * 100}%` }} />
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}
