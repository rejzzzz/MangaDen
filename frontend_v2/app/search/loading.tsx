import { Navbar } from "@/components/navbar"

export default function SearchLoading() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8 space-y-6">
        {/* Search bar skeleton */}
        <div className="flex gap-2">
          <div className="h-11 flex-1 rounded-lg bg-card animate-pulse" />
          <div className="h-11 w-24 rounded-lg bg-card animate-pulse" />
        </div>

        {/* Results grid skeleton */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4">
          {Array.from({ length: 24 }).map((_, i) => (
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
