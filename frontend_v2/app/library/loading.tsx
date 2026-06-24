import { Navbar } from "@/components/navbar"

export default function LibraryLoading() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <div className="h-7 w-36 rounded bg-card animate-pulse mb-8" />

        {/* Bookmarks section */}
        <div className="mb-12">
          <div className="h-5 w-28 rounded bg-card animate-pulse mb-4" />
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-2">
                <div className="aspect-[2/3] rounded-md bg-card animate-pulse" />
                <div className="h-3 rounded bg-card animate-pulse w-3/4" />
              </div>
            ))}
          </div>
        </div>

        {/* Continue Reading section */}
        <div>
          <div className="h-5 w-40 rounded bg-card animate-pulse mb-4" />
          <div className="flex flex-col gap-2 border border-border rounded-md overflow-hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 bg-card animate-pulse" />
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
