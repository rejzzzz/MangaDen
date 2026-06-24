import { Navbar } from "@/components/navbar"

function CardSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <div className="aspect-[2/3] rounded-md bg-card animate-pulse" />
      <div className="h-3 rounded bg-card animate-pulse w-3/4" />
      <div className="h-2.5 rounded bg-card animate-pulse w-1/2" />
    </div>
  )
}

export default function BrowseLoading() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="h-7 w-20 rounded bg-card animate-pulse" />
          <div className="flex items-center gap-2">
            <div className="h-9 w-64 rounded-md bg-card animate-pulse" />
            <div className="h-9 w-20 rounded-md bg-card animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4">
          {Array.from({ length: 24 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </main>
    </div>
  )
}
