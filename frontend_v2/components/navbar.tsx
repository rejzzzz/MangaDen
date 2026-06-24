"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { Search, BookOpen, User, LogOut, Menu, X, Library, ChevronDown, Shield } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"

export function Navbar() {
  const { user, signOut, loading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  const [searchOpen, setSearchOpen] = useState(false)
  const [searchValue, setSearchValue] = useState("")
  const [menuOpen, setMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const userMenuRef = useRef<HTMLDivElement>(null)
  const searchRef   = useRef<HTMLInputElement>(null)

  const onSearchPage = pathname === "/search"

  // Close user dropdown on outside click
  useEffect(() => {
    if (!userMenuOpen) return
    function handleClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [userMenuOpen])

  // Close mobile menu on route change
  useEffect(() => {
    setMenuOpen(false)
    setSearchOpen(false)
  }, [pathname])

  // "/" shortcut — focuses the inline search input when NOT on the search page
  useEffect(() => {
    if (onSearchPage) return
    function handler(e: KeyboardEvent) {
      if (e.key !== "/" || e.ctrlKey || e.metaKey || e.altKey) return
      const tag = (e.target as HTMLElement).tagName
      if (tag === "INPUT" || tag === "TEXTAREA") return
      e.preventDefault()
      setSearchOpen(true)
      // Focus happens via autoFocus on the input itself
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [onSearchPage])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const q = searchValue.trim()
    if (q) {
      router.push(`/search?q=${encodeURIComponent(q)}`)
      setSearchOpen(false)
      setSearchValue("")
    }
  }

  async function handleSignOut() {
    setUserMenuOpen(false)
    await signOut()
    router.push("/")
  }

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/")
  const isExact = (href: string) => pathname === href

  // Never carry a redirect param when already on / — it just sends the user back to / anyway.
  const authHref =
    pathname === "/"
      ? "/auth"
      : `/auth?redirect=${encodeURIComponent(pathname)}`

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex h-14 items-center justify-between gap-4">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <BookOpen className="size-5 text-primary" aria-hidden="true" />
            <span className="font-semibold tracking-tight text-foreground">
              Manga<span className="text-primary">Den</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
            <Link
              href="/browse"
              className={cn(
                "px-3 py-1.5 rounded-md text-sm transition-colors",
                isExact("/browse")
                  ? "text-foreground bg-card"
                  : "text-muted-foreground hover:text-foreground hover:bg-card/50"
              )}
            >
              Browse
            </Link>
            <Link
              href="/trending"
              className={cn(
                "px-3 py-1.5 rounded-md text-sm transition-colors",
                isExact("/trending")
                  ? "text-foreground bg-card"
                  : "text-muted-foreground hover:text-foreground hover:bg-card/50"
              )}
            >
              Trending
            </Link>
            <Link
              href="/search"
              className={cn(
                "px-3 py-1.5 rounded-md text-sm transition-colors",
                isExact("/search")
                  ? "text-foreground bg-card"
                  : "text-muted-foreground hover:text-foreground hover:bg-card/50"
              )}
            >
              Search
            </Link>
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-1">

            {/* Search — link to /search when already there; inline input elsewhere */}
            {onSearchPage ? (
              <Link
                href="/search"
                className="p-2 text-primary rounded-md bg-card/50"
                aria-label="Search"
                aria-current="page"
              >
                <Search className="size-4" />
              </Link>
            ) : searchOpen ? (
              <form onSubmit={handleSearch} className="flex items-center gap-1">
                <input
                  ref={searchRef}
                  autoFocus
                  type="text"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder="Search titles\u2026"
                  className="h-8 w-44 sm:w-60 rounded-md bg-card border border-border px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  aria-label="Search manga"
                />
                <button
                  type="button"
                  onClick={() => { setSearchOpen(false); setSearchValue("") }}
                  className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Close search"
                >
                  <X className="size-4" />
                </button>
              </form>
            ) : (
              <button
                onClick={() => setSearchOpen(true)}
                className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-card/50"
                aria-label="Search (or press /)"
              >
                <Search className="size-4" />
              </button>
            )}

            {/* Auth area — hidden while auth is loading to prevent flash */}
            {!loading && (
              <>
                {user ? (
                  <>
                    {/* Library link — desktop only */}
                    <Link
                      href="/library"
                      className={cn(
                        "hidden md:flex p-2 rounded-md transition-colors",
                        isActive("/library")
                          ? "text-foreground bg-card"
                          : "text-muted-foreground hover:text-foreground hover:bg-card/50"
                      )}
                      aria-label="My Library"
                    >
                      <Library className="size-4" />
                    </Link>

                    {/* User dropdown */}
                    <div ref={userMenuRef} className="relative">
                      <button
                        onClick={() => setUserMenuOpen(!userMenuOpen)}
                        className="hidden md:flex items-center gap-1.5 rounded-full border border-border pl-2 pr-2.5 py-1 text-xs text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
                        aria-haspopup="true"
                        aria-expanded={userMenuOpen}
                      >
                        {user.avatarUrl ? (
                          <img
                            src={user.avatarUrl}
                            alt=""
                            className="size-5 rounded-full object-cover"
                          />
                        ) : (
                          <User className="size-3.5" />
                        )}
                        <span className="max-w-24 truncate">{user.username}</span>
                        <ChevronDown className={cn("size-3 transition-transform", userMenuOpen && "rotate-180")} />
                      </button>

                      {/* Dropdown panel */}
                      {userMenuOpen && (
                        <div
                          role="menu"
                          className="absolute right-0 top-[calc(100%+6px)] w-44 rounded-md border border-border bg-popover shadow-xl py-1 z-50"
                        >
                          <Link
                            href="/library"
                            role="menuitem"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-card transition-colors"
                          >
                            <Library className="size-3.5" />
                            My Library
                          </Link>
                          {user.role === "admin" && (
                            <Link
                              href="/admin"
                              role="menuitem"
                              onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-2 px-3 py-2 text-sm text-primary hover:bg-card transition-colors"
                            >
                              <Shield className="size-3.5" />
                              Admin Dashboard
                            </Link>
                          )}
                          <div className="my-1 border-t border-border" />
                          <button
                            role="menuitem"
                            onClick={handleSignOut}
                            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-card transition-colors"
                          >
                            <LogOut className="size-3.5" />
                            Sign Out
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <Link
                    href={authHref}
                    className="hidden md:inline-flex rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    Sign In
                  </Link>
                )}
              </>
            )}

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-card/50"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
            </button>
          </div>
        </div>

        {/* Mobile nav drawer */}
        {menuOpen && (
          <nav
            className="md:hidden py-3 border-t border-border flex flex-col gap-0.5 text-sm"
            aria-label="Mobile navigation"
          >
            <Link
              href="/browse"
              className={cn(
                "px-3 py-2 rounded-md transition-colors",
                isExact("/browse") ? "text-foreground bg-card" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Browse
            </Link>
            <Link
              href="/trending"
              className={cn(
                "px-3 py-2 rounded-md transition-colors",
                isExact("/trending") ? "text-foreground bg-card" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Trending
            </Link>
            <Link
              href="/search"
              className={cn(
                "px-3 py-2 rounded-md transition-colors",
                isExact("/search") ? "text-foreground bg-card" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Search
            </Link>
            {user ? (
              <>
                <Link
                  href="/library"
                  className={cn(
                    "px-3 py-2 rounded-md transition-colors",
                    isActive("/library") ? "text-foreground bg-card" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  My Library
                </Link>
                {user.role === "admin" && (
                  <Link
                    href="/admin"
                    className={cn(
                      "px-3 py-2 rounded-md transition-colors flex items-center gap-2",
                      isActive("/admin") ? "text-primary bg-card" : "text-primary hover:bg-card"
                    )}
                  >
                    <Shield className="size-4" />
                    Admin Dashboard
                  </Link>
                )}
                <button
                  onClick={handleSignOut}
                  className="px-3 py-2 rounded-md text-left text-muted-foreground hover:text-foreground transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                href={authHref}
                className="px-3 py-2 rounded-md text-muted-foreground hover:text-foreground transition-colors"
              >
                Sign In
              </Link>
            )}
          </nav>
        )}
      </div>
    </header>
  )
}
