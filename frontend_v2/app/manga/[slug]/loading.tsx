import { Navbar } from "@/components/navbar"

export default function MangaDetailLoading() {
  return (
    <div className="min-h-screen">
      <Navbar />
      {/* Hero area skeleton */}
      <div className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10 flex flex-col sm:flex-row gap-7">
          <div className="shrink-0 w-36 sm:w-48 aspect-[2/3] rounded-lg bg-card animate-pulse" />
          <div className="flex flex-col gap-3 flex-1 py-1">
            <div className="flex gap-2">
              <div className="h-5 w-16 rounded bg-card animate-pulse" />
              <div className="h-5 w-16 rounded bg-card animate-pulse" />
            </div>
            <div className="h-9 w-3/4 rounded bg-card animate-pulse" />
            <div className="h-4 w-1/3 rounded bg-card animate-pulse" />
            <div className="h-16 w-full rounded bg-card animate-pulse mt-1" />
            <div className="flex gap-2 mt-1">
              <div className="h-9 w-32 rounded-md bg-card animate-pulse" />
              <div className="h-9 w-28 rounded-md bg-card animate-pulse" />
            </div>
          </div>
        </div>
      </div>
      {/* Chapter list skeleton */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <div className="h-5 w-24 rounded bg-card animate-pulse mb-4" />
        <div className="flex flex-col border border-border rounded-md overflow-hidden">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-12 border-b border-border bg-card/30 animate-pulse last:border-b-0" />
          ))}
        </div>
      </div>
    </div>
  )
}
