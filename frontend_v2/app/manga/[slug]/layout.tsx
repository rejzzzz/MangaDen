import type { Metadata } from "next"

const DEFAULT_API_URL = "https://api.mangaden.rejwanul.dev"
const BASE_URL = (process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL).replace(/\/+$/, "")

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  try {
    const res = await fetch(`${BASE_URL}/api/manga/${slug}`, { next: { revalidate: 3600 } })
    if (res.ok) {
      const data = await res.json()
      const manga = data?.data
      if (manga?.title) {
        return {
          title: `${manga.title} — MangaDen`,
          description:
            manga.description
              ? manga.description.slice(0, 155)
              : `Read ${manga.title} on MangaDen — ${manga.type ?? "manga"} by ${manga.author ?? "unknown author"}.`,
        }
      }
    }
  } catch {
    // fall through to default
  }
  return {
    title: "Manga — MangaDen",
    description: "Read manga, manhwa, manhua, and webtoons on MangaDen.",
  }
}

export default function MangaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
