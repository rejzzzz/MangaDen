"use client"

import { use } from "react"
import useSWR from "swr"
import { notFound } from "next/navigation"
import { Loader2 } from "lucide-react"
import { ReaderClient } from "./reader-client"
import { manga as mangaApi, chapters as chaptersApi } from "@/lib/api"

export default function ReaderPage({
  params,
}: {
  params: Promise<{ slug: string; chapterId: string }>
}) {
  const { slug, chapterId } = use(params)

  const { data: chapterRes, error: chapterError, isLoading: chapterLoading } =
    useSWR(["chapter-pages", chapterId], () => chaptersApi.pages(chapterId))
  const { data: mangaRes, isLoading: mangaLoading } = useSWR(["manga", slug], () =>
    mangaApi.get(slug)
  )

  if (chapterError && (chapterError as { status?: number })?.status === 404) {
    notFound()
  }

  const chapter = chapterRes?.success ? chapterRes.data : null
  const mangaBase = mangaRes?.success ? mangaRes.data : null

  // If the manga response didn't embed chapters, fetch them separately so the
  // reader has a full chapter list for prev/next navigation.
  const needsChapterFetch = !!mangaBase && (!mangaBase.chapters || mangaBase.chapters.length === 0)
  const { data: chaptersRes, isLoading: chaptersLoading } = useSWR(
    needsChapterFetch ? ["chapters", slug] : null,
    () => chaptersApi.list(slug)
  )
  const manga = mangaBase
    ? {
        ...mangaBase,
        chapters:
          mangaBase.chapters && mangaBase.chapters.length > 0
            ? mangaBase.chapters
            : (chaptersRes?.data ?? []),
      }
    : null

  const isLoading = chapterLoading || mangaLoading || (needsChapterFetch && chaptersLoading)

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="size-6 text-primary animate-spin" />
      </div>
    )
  }

  if (!chapter || !manga) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-background px-4 text-center">
        <p className="text-muted-foreground text-sm">
          Could not load this chapter. Please try again.
        </p>
      </div>
    )
  }

  return <ReaderClient chapter={chapter} manga={manga} />
}
