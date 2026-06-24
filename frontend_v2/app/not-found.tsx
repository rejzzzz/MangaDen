import Link from "next/link"
import { ArrowLeft, Search, Compass } from "lucide-react"
import { Navbar } from "@/components/navbar"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <div className="flex-1 flex flex-col items-center justify-center px-4 text-center gap-8">
      {/* 404 Display */}
      <div className="flex flex-col items-center gap-3">
        <div className="relative select-none">
          <span className="text-[9rem] font-black leading-none text-muted-foreground/10 tracking-tighter">
            404
          </span>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-muted rounded-full p-4">
              <Search className="size-8 text-muted-foreground/60" />
            </div>
          </div>
        </div>
        <h1 className="text-xl font-bold text-foreground">Page not found</h1>
        <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
          The page you&apos;re looking for doesn&apos;t exist or has been moved. Try browsing our collection instead.
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          Back to home
        </Link>
        <Link
          href="/browse"
          className="flex items-center gap-2 rounded-md border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
        >
          <Compass className="size-3.5" />
          Browse manga
        </Link>
      </div>
      </div>
    </div>
  )
}
