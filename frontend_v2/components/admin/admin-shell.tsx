"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Loader2, Menu, X, ShieldAlert, User as UserIcon } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { AdminSidebar } from "./admin-sidebar"
import { ToastProvider, AdminButton } from "./admin-ui"

/**
 * Admin shell: enforces auth + admin role, renders the persistent sidebar,
 * a mobile top bar, and wraps content in the ToastProvider.
 */
export function AdminShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  // Redirect anonymous users to sign in.
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/auth?redirect=/admin")
    }
  }, [user, loading, router])

  // Loading state.
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-5 text-primary animate-spin" />
      </div>
    )
  }

  // Anonymous — redirect is in flight.
  if (!user) return null

  // Authenticated but not an admin — hard block.
  if (user.role !== "admin") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <ShieldAlert className="size-12 text-destructive" aria-hidden="true" />
        <div className="flex flex-col gap-1">
          <h1 className="text-lg font-semibold text-foreground">Access denied</h1>
          <p className="text-sm text-muted-foreground max-w-sm">
            {"You need administrator privileges to view this area. If you believe this is a mistake, contact a site administrator."}
          </p>
        </div>
        <Link
          href="/"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Return home
        </Link>
      </div>
    )
  }

  return (
    <ToastProvider>
      <div className="min-h-screen lg:flex">
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex lg:w-60 lg:flex-col lg:fixed lg:inset-y-0 border-r border-border bg-background">
          <AdminSidebar />
        </aside>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="lg:hidden fixed inset-0 z-[90]">
            <div
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
              aria-hidden="true"
            />
            <aside className="absolute inset-y-0 left-0 w-64 border-r border-border bg-background">
              <AdminSidebar onNavigate={() => setMobileOpen(false)} />
            </aside>
          </div>
        )}

        {/* Main column */}
        <div className="flex-1 lg:pl-60">
          {/* Mobile top bar */}
          <div className="lg:hidden sticky top-0 z-50 flex h-14 items-center justify-between border-b border-border bg-background/95 backdrop-blur-sm px-4">
            <button
              onClick={() => setMobileOpen(true)}
              className="p-2 -ml-2 text-muted-foreground hover:text-foreground rounded-md hover:bg-card transition-colors"
              aria-label="Open admin menu"
            >
              <Menu className="size-5" />
            </button>
            <span className="font-semibold text-foreground">
              Manga<span className="text-primary">Den</span> Admin
            </span>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <UserIcon className="size-3.5" />
              <span className="max-w-20 truncate">{user.username}</span>
            </div>
          </div>

          {/* Desktop header */}
          <header className="hidden lg:flex h-14 items-center justify-end gap-3 border-b border-border bg-background/95 backdrop-blur-sm px-6 sticky top-0 z-40">
            <span className="text-xs text-muted-foreground">
              Signed in as <span className="text-foreground font-medium">{user.username}</span>
            </span>
            <span className="flex size-7 items-center justify-center rounded-full bg-primary/15 text-primary">
              <UserIcon className="size-3.5" />
            </span>
          </header>

          <main className="px-4 sm:px-6 py-6 max-w-6xl mx-auto w-full">{children}</main>
        </div>
      </div>
    </ToastProvider>
  )
}

/** Convenience close button used by the mobile drawer header if needed. */
export function CloseDrawerButton({ onClick }: { onClick: () => void }) {
  return (
    <AdminButton variant="ghost" size="sm" onClick={onClick} aria-label="Close menu">
      <X className="size-4" />
    </AdminButton>
  )
}
