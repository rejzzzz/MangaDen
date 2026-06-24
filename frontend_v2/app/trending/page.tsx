"use client"

import { useState } from "react"
import { TrendingUp } from "lucide-react"
import useSWR from "swr"
import { Navbar } from "@/components/navbar"
import { MangaCard } from "@/components/manga-card"
import { trending as trendingApi } from "@/lib/api"
import { cn } from "@/lib/utils"

const PERIODS = [
  { value: "1d", label: "Today" },
  { value: "7d", label: "This Week" },
  { value: "30d", label: "This Month" },
] as const

type Period = "1d" | "7d" | "30d"

export default function TrendingPage() {
  const [period, setPeriod] = useState<Period>("7d")

  const { data, isLoading } = useSWR(["trending", period], () =>
    trendingApi.get(period, 50)
  )

  // trendingApi.get() now resolves to a flat TrendingManga[]
  const results = data ?? []

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <h1 className="flex items-center gap-2 text-xl font-semibold text-foreground">
            <TrendingUp className="size-5 text-primary" />
            Trending
          </h1>

          {/* Period tabs */}
          <div className="flex items-center gap-1 p-1 rounded-md bg-card border border-border">
            {PERIODS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setPeriod(value)}
                className={cn(
                  "px-3 py-1.5 rounded text-xs font-medium transition-colors",
                  period === value
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

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
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4">
            {results.map((item, i) => (
              <div key={item.id} className="relative">
                {/* Rank badge — coloured for top 3, subtle for the rest */}
                <span
                  className={cn(
                    "absolute -top-1 -left-1 z-10 min-w-[1.25rem] h-5 px-1 flex items-center justify-center rounded-full text-[10px] font-bold shadow",
                    i === 0
                      ? "bg-primary text-primary-foreground"
                      : i === 1
                      ? "bg-muted text-foreground border border-border"
                      : i === 2
                      ? "bg-muted text-foreground border border-border"
                      : "bg-background/80 text-muted-foreground border border-border/60 backdrop-blur-sm"
                  )}
                >
                  {i + 1}
                </span>
                <MangaCard
                  slug={item.slug}
                  title={item.title}
                  coverUrl={item.coverUrl}
                  type={item.type}
                  status={item.status}
                  viewCount={item.viewCount}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="py-24 flex flex-col items-center gap-3 text-center">
            <TrendingUp className="size-10 text-muted-foreground/30" />
            <p className="text-muted-foreground text-sm">No trending data yet.</p>
          </div>
        )}
      </main>
    </div>
  )
}
