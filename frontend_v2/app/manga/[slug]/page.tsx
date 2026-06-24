"use client"

import { use } from "react"
import useSWR from "swr"
import { notFound } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { MangaDetailClient } from "./manga-detail-client"
import { manga as mangaApi } from "@/lib/api"

function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8 flex flex-col sm:flex-row gap-6">
      <div className="w-40 sm:w-56 shrink-0 aspect-[2/3] rounded-lg bg-card animate-pulse" />
      <div className="flex flex-col gap-3 flex-1">
        <div className="h-7 w-2/3 rounded bg-card animate-pulse" />
        <div className="h-4 w-1/3 rounded bg-card animate-pulse" />
        <div className="h-20 w-full rounded bg-card animate-pulse mt-2" />
      </div>
    </div>
  )
}

export default function MangaDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = use(params)
  const { data, error, isLoading } = useSWR(["manga", slug], () =>
    mangaApi.get(slug)
  )

  // A 404 from the API means the manga doesn't exist.
  if (error && (error as { status?: number })?.status === 404) notFound()

  return (
    <div className="min-h-screen">
      <Navbar />
      {isLoading ? (
        <DetailSkeleton />
      ) : data?.success && data.data ? (
        <MangaDetailClient manga={data.data} />
      ) : (
        <div className="mx-auto max-w-5xl px-4 py-24 text-center">
          <p className="text-muted-foreground text-sm">
            Could not load this title. Please try again.
          </p>
        </div>
      )}
    </div>
  )
}
