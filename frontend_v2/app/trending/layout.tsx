import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Trending — MangaDen",
  description:
    "See the most-read manga, manhwa, manhua, and webtoons today, this week, or this month on MangaDen.",
}

export default function TrendingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
