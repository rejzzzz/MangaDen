import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Browse — MangaDen",
  description:
    "Search and filter thousands of manga, manhwa, manhua, and webtoon titles. Find your next favourite series on MangaDen.",
}

export default function BrowseLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
