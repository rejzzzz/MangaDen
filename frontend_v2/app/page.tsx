"use client"

import Link from "next/link"
import { ArrowRight, TrendingUp, BookOpen, Layers } from "lucide-react"
import useSWR from "swr"
import { Navbar } from "@/components/navbar"
import { MangaCard } from "@/components/manga-card"
import { trending as trendingApi, manga as mangaApi } from "@/lib/api"

function CardSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <div className="aspect-[2/3] rounded-md bg-card animate-pulse" />
      <div className="h-3 rounded bg-card animate-pulse w-3/4" />
    </div>
  )
}

export default function HomePage() {
  const { data: trending, isLoading: trendingLoading } = useSWR(
    ["home-trending"],
    () => trendingApi.get("7d", 12)
  )
  const { data: latestRes, isLoading: latestLoading } = useSWR(
    ["home-latest"],
    () => mangaApi.list({ page: 1, limit: 18 })
  )

  const trendingItems = trending ?? []
  const latest = latestRes?.data ?? []
  const hero = trendingItems[0] ?? null

  return (
    <div className="min-h-screen">
      <Navbar />

      <main>
        {/* Hero — first trending item, or static welcome when still loading / no data */}
        <section className="relative overflow-hidden border-b border-border">
          {hero && (
            <div
              className="absolute inset-0 scale-110 blur-3xl opacity-15"
              style={{
                backgroundImage: `url(${hero.coverUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
              aria-hidden="true"
            />
          )}
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-12 sm:py-16 flex items-center gap-8">
            {hero ? (
              <>
                <Link href={`/manga/${hero.slug}`} className="shrink-0 group">
                  <img
                    src={hero.coverUrl}
                    alt={hero.title}
                    className="w-32 sm:w-44 aspect-[2/3] object-cover rounded-lg shadow-xl ring-1 ring-border group-hover:ring-primary/50 transition-all"
                  />
                </Link>
                <div className="flex flex-col gap-3 min-w-0">
                  <span className="flex items-center gap-1.5 text-xs font-medium text-primary uppercase tracking-widest">
                    <TrendingUp className="size-3" />
                    Trending this week
                  </span>
                  <h1 className="text-2xl sm:text-4xl font-bold text-foreground leading-tight text-balance">
                    {hero.title}
                  </h1>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="capitalize">{hero.type}</span>
                    <span>·</span>
                    <span className="capitalize">{hero.status}</span>
                  </div>
                  <Link
                    href={`/manga/${hero.slug}`}
                    className="mt-2 inline-flex w-fit items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    Start Reading
                    <ArrowRight className="size-3.5" />
                  </Link>
                </div>
              </>
            ) : trendingLoading ? (
              /* Skeleton hero while trending loads */
              <>
                <div className="shrink-0 w-32 sm:w-44 aspect-[2/3] rounded-lg bg-card animate-pulse" />
                <div className="flex flex-col gap-3 flex-1">
                  <div className="h-3 w-28 rounded bg-card animate-pulse" />
                  <div className="h-8 w-3/4 rounded bg-card animate-pulse" />
                  <div className="h-3 w-24 rounded bg-card animate-pulse" />
                  <div className="h-9 w-32 rounded-md bg-card animate-pulse mt-1" />
                </div>
              </>
            ) : (
              /* Static welcome when no trending data */
              <div className="flex flex-col gap-3 py-2">
                <span className="flex items-center gap-1.5 text-xs font-medium text-primary uppercase tracking-widest">
                  <BookOpen className="size-3" />
                  Welcome to MangaDen
                </span>
                <h1 className="text-2xl sm:text-4xl font-bold text-foreground leading-tight text-balance">
                  Read manga, manhwa &amp; webtoons for free.
                </h1>
                <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
                  Discover thousands of titles updated daily. Track your progress, build your library, and pick up right where you left off.
                </p>
                <Link
                  href="/browse"
                  className="mt-2 inline-flex w-fit items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Browse all titles
                  <ArrowRight className="size-3.5" />
                </Link>
              </div>
            )}
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10 flex flex-col gap-12">
          {/* Trending row — hidden entirely once loaded with no data */}
          {(trendingLoading || trendingItems.length > 0) && (
            <section>
              <div className="flex items-center justify-between mb-5">
                <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
                  <TrendingUp className="size-4 text-primary" />
                  Trending
                </h2>
                <Link
                  href="/trending"
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  View all
                  <ArrowRight className="size-3" />
                </Link>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 sm:gap-4">
                {trendingLoading
                  ? Array.from({ length: 12 }).map((_, i) => <CardSkeleton key={i} />)
                  : trendingItems.slice(0, 12).map((item) => (
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
            </section>
          )}

          {/* Latest manga */}
          {(latestLoading || latest.length > 0) && (
            <section>
              <div className="flex items-center justify-between mb-5">
                <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
                  <BookOpen className="size-4 text-primary" />
                  Latest Added
                </h2>
                <Link
                  href="/browse"
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  Browse all
                  <ArrowRight className="size-3" />
                </Link>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4">
                {latestLoading
                  ? Array.from({ length: 18 }).map((_, i) => <CardSkeleton key={i} />)
                  : latest.map((item) => (
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
            </section>
          )}

          {/* Empty state */}
          {!trendingLoading &&
            !latestLoading &&
            trendingItems.length === 0 &&
            latest.length === 0 && (
              <div className="py-24 flex flex-col items-center gap-4 text-center">
                <Layers className="size-12 text-muted-foreground/30" />
                <p className="text-muted-foreground text-sm">
                  No content available yet. Check back soon.
                </p>
              </div>
            )}
        </div>
      </main>

      <footer className="border-t border-border py-8 mt-4">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <BookOpen className="size-3.5 text-primary" />
            MangaDen
          </span>
          <span>Read manga, manhwa &amp; webtoons for free.</span>
        </div>
      </footer>
    </div>
  )
}
