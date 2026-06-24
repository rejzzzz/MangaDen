"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  BookText,
  Layers,
  Users,
  BarChart3,
  Settings,
  ExternalLink,
  BookOpen,
} from "lucide-react"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/manga", label: "Manga", icon: BookText },
  { href: "/admin/chapters", label: "Chapters", icon: Layers },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/settings", label: "Settings", icon: Settings },
]

export function AdminSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + "/")

  return (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className="flex h-14 items-center gap-2 border-b border-border px-5 shrink-0">
        <BookOpen className="size-5 text-primary" aria-hidden="true" />
        <span className="font-semibold tracking-tight text-foreground">
          Manga<span className="text-primary">Den</span>
        </span>
        <span className="ml-1 rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-medium text-primary leading-none">
          Admin
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Admin navigation">
        <ul className="flex flex-col gap-0.5">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href, item.exact)
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-card"
                  )}
                >
                  <item.icon className="size-4 shrink-0" aria-hidden="true" />
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Footer — back to site */}
      <div className="border-t border-border p-3 shrink-0">
        <Link
          href="/"
          onClick={onNavigate}
          className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-card transition-colors"
        >
          <ExternalLink className="size-4 shrink-0" aria-hidden="true" />
          View Site
        </Link>
      </div>
    </div>
  )
}
