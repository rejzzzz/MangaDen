"use client"

import Link from "next/link"
import { Eye, BookOpen } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

interface MangaCardProps {
  slug: string
  title: string
  coverUrl: string
  type?: string
  status?: string
  viewCount?: number
  className?: string
}

const STATUS_COLORS: Record<string, string> = {
  ongoing: "bg-green-500/15 text-green-400",
  completed: "bg-blue-500/15 text-blue-400",
  hiatus: "bg-yellow-500/15 text-yellow-400",
  cancelled: "bg-red-500/15 text-red-400",
}

const TYPE_LABELS: Record<string, string> = {
  manga: "Manga",
  manhwa: "Manhwa",
  manhua: "Manhua",
  webtoon: "Webtoon",
}

function formatViewCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return String(n)
}

export function MangaCard({
  slug,
  title,
  coverUrl,
  type,
  status,
  viewCount,
  className,
}: MangaCardProps) {
  const [imgError, setImgError] = useState(false)

  return (
    <Link
      href={`/manga/${slug}`}
      className={cn("group relative flex flex-col", className)}
    >
      {/* Cover */}
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-md bg-card">
        {!imgError ? (
          <img
            src={coverUrl}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            decoding="async"
            onError={() => setImgError(true)}
          />
        ) : (
          /* Fallback cover — shows when the image URL is broken */
          <div className="h-full w-full flex flex-col items-center justify-center gap-2 bg-card text-muted-foreground/30 p-2">
            <BookOpen className="size-6" />
            <span className="text-[9px] text-center text-muted-foreground/40 line-clamp-2 leading-tight">
              {title}
            </span>
          </div>
        )}

        {/* Hover overlay — view count */}
        <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end p-2">
          {viewCount !== undefined && viewCount > 0 && (
            <span className="flex items-center gap-1 text-[10px] text-foreground font-medium">
              <Eye className="size-3" />
              {formatViewCount(viewCount)}
            </span>
          )}
        </div>

        {/* Type badge — top left */}
        {type && (
          <span className="absolute top-1.5 left-1.5 rounded px-1.5 py-0.5 text-[9px] font-medium bg-background/80 text-muted-foreground backdrop-blur-sm leading-none">
            {TYPE_LABELS[type] ?? type}
          </span>
        )}

        {/* Status badge — top right */}
        {status && (
          <span
            className={cn(
              "absolute top-1.5 right-1.5 rounded px-1.5 py-0.5 text-[9px] font-medium capitalize leading-none",
              STATUS_COLORS[status] ?? "bg-muted/80 text-muted-foreground"
            )}
          >
            {status}
          </span>
        )}
      </div>

      {/* Title */}
      <p className="mt-2 text-[13px] font-medium leading-snug text-foreground line-clamp-2 group-hover:text-primary transition-colors">
        {title}
      </p>
    </Link>
  )
}
