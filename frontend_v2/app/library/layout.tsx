import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "My Library — MangaDen",
  description:
    "View your bookmarked series and continue reading where you left off on MangaDen.",
}

export default function LibraryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
