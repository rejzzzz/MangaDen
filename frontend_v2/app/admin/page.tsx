"use client"

import Link from "next/link"
import useSWR from "swr"
import {
  BookText,
  Layers,
  Users,
  Eye,
  ArrowRight,
  Activity,
  Plus,
  TrendingUp,
  type LucideIcon,
} from "lucide-react"
import { StatCard, SectionHeader, AdminButton, ApiNotice, Badge } from "@/components/admin/admin-ui"
import { adminDashboard } from "@/lib/admin-api"
import { manga as mangaApi, trending as trendingApi } from "@/lib/api"
import type { AdminStats } from "@/lib/admin-types"

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

export default function AdminDashboardPage() {
  // Primary source: the dedicated admin stats endpoint (not yet implemented).
  const { data: statsRes, error: statsError, isLoading: statsLoading } = useSWR(
    "admin-stats",
    () => adminDashboard.stats(),
    { shouldRetryOnError: false }
  )

  // Fallback source: derive partial real numbers from public endpoints so the
  // dashboard is useful even before the admin stats endpoint exists.
  const { data: fallbackManga } = useSWR(
    statsError ? "admin-stats-fallback" : null,
    () => mangaApi.list({ page: 1, limit: 50 }),
    { shouldRetryOnError: false }
  )
  const { data: fallbackTrending } = useSWR(
    statsError ? "admin-trending-fallback" : null,
    () => trendingApi.get("30d", 5),
    { shouldRetryOnError: false }
  )

  const { data: activityRes, error: activityError, isLoading: activityLoading } = useSWR(
    "admin-activity",
    () => adminDashboard.activity(8),
    { shouldRetryOnError: false }
  )

  const stats: Partial<AdminStats> = statsRes?.data ?? {}
  const usingFallback = !!statsError

  const cards: { label: string; value: string | number; icon: LucideIcon; delta?: string; deltaPositive?: boolean }[] = [
    {
      label: "Total Manga",
      value: stats.totalManga != null ? formatNumber(stats.totalManga) : usingFallback ? "—" : 0,
      icon: BookText,
      delta: stats.newMangaThisMonth != null ? `+${stats.newMangaThisMonth} this month` : undefined,
      deltaPositive: true,
    },
    {
      label: "Total Chapters",
      value: stats.totalChapters != null ? formatNumber(stats.totalChapters) : usingFallback ? "—" : 0,
      icon: Layers,
    },
    {
      label: "Total Users",
      value: stats.totalUsers != null ? formatNumber(stats.totalUsers) : usingFallback ? "—" : 0,
      icon: Users,
      delta: stats.newUsersThisMonth != null ? `+${stats.newUsersThisMonth} this month` : undefined,
      deltaPositive: true,
    },
    {
      label: "Total Views",
      value: stats.totalViews != null ? formatNumber(stats.totalViews) : usingFallback ? "—" : 0,
      icon: Eye,
      delta: stats.viewsThisMonth != null ? `+${formatNumber(stats.viewsThisMonth)} this month` : undefined,
      deltaPositive: true,
    },
  ]

  const activity = activityRes?.data ?? []
  const topManga = fallbackTrending ?? []

  return (
    <div>
      <SectionHeader
        title="Dashboard"
        description="Overview of your catalog, community, and activity."
        action={
          <Link href="/admin/manga/new">
            <AdminButton>
              <Plus className="size-4" />
              Add Manga
            </AdminButton>
          </Link>
        }
      />

      {usingFallback && (
        <div className="mb-6">
          <ApiNotice message="The admin stats endpoint (GET /api/admin/stats) is not implemented yet, so live metrics are unavailable. See ADMIN_API.md for the expected response shape." />
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {cards.map((c) => (
          <StatCard
            key={c.label}
            label={c.label}
            value={c.value}
            icon={c.icon}
            delta={c.delta}
            deltaPositive={c.deltaPositive}
            loading={statsLoading}
          />
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent activity */}
        <section className="rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Activity className="size-4 text-primary" />
              Recent Activity
            </h2>
          </div>
          <div className="p-4">
            {activityLoading ? (
              <div className="flex flex-col gap-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-10 rounded bg-background animate-pulse" />
                ))}
              </div>
            ) : activityError ? (
              <ApiNotice message="Activity log (GET /api/admin/activity) is not implemented yet. It will show admin actions like manga edits, user changes, and deletions." />
            ) : activity.length > 0 ? (
              <ul className="flex flex-col divide-y divide-border">
                {activity.map((entry) => (
                  <li key={entry.id} className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0">
                    <span className="mt-1 size-1.5 rounded-full bg-primary shrink-0" />
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-sm text-foreground truncate">{entry.summary}</span>
                      <span className="text-xs text-muted-foreground">
                        {entry.actorName} ·{" "}
                        {new Date(entry.createdAt).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground py-6 text-center">No recent activity.</p>
            )}
          </div>
        </section>

        {/* Top manga (real data via trending fallback / always useful) */}
        <section className="rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="flex items-center gap-2 text-sm font-medium text-foreground">
              <TrendingUp className="size-4 text-primary" />
              Top Titles (30d)
            </h2>
            <Link
              href="/admin/analytics"
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              Analytics <ArrowRight className="size-3" />
            </Link>
          </div>
          <div className="p-4">
            <TopMangaList />
          </div>
        </section>
      </div>

      {/* Quick links */}
      <section className="mt-6">
        <h2 className="text-sm font-medium text-foreground mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <QuickLink href="/admin/manga" icon={BookText} label="Manage Manga" />
          <QuickLink href="/admin/chapters" icon={Layers} label="Manage Chapters" />
          <QuickLink href="/admin/users" icon={Users} label="Manage Users" />
          <QuickLink href="/admin/settings" icon={Activity} label="Site Settings" />
        </div>
      </section>
    </div>
  )
}

function TopMangaList() {
  const { data, isLoading } = useSWR("admin-top-manga", () => trendingApi.get("30d", 5), {
    shouldRetryOnError: false,
  })
  const items = data ?? []

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-10 rounded bg-background animate-pulse" />
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground py-6 text-center">No trending data.</p>
  }

  return (
    <ul className="flex flex-col divide-y divide-border">
      {items.map((m, i) => (
        <li key={m.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
          <span className="text-xs font-semibold text-muted-foreground tabular-nums w-4 text-center">
            {i + 1}
          </span>
          <Link
            href={`/manga/${m.slug}`}
            className="flex-1 text-sm text-foreground hover:text-primary truncate transition-colors"
          >
            {m.title}
          </Link>
          <Badge variant="primary">{formatNumber(m.viewCount)} views</Badge>
        </li>
      ))}
    </ul>
  )
}

function QuickLink({ href, icon: Icon, label }: { href: string; icon: LucideIcon; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
    >
      <Icon className="size-4 text-primary shrink-0" />
      <span className="truncate">{label}</span>
    </Link>
  )
}
