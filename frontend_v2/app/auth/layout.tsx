import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Sign In — MangaDen",
  description: "Sign in or create a free MangaDen account to bookmark titles and track reading progress.",
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
