"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { BookOpen, Eye, EyeOff, Loader2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { getErrorMessage } from "@/lib/api"
import { cn } from "@/lib/utils"

type Tab = "signin" | "signup"

export default function AuthPage() {
  return (
    <Suspense>
      <AuthContent />
    </Suspense>
  )
}

function AuthContent() {
  const { signIn, signUp } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get("redirect") ?? "/"

  const [tab, setTab] = useState<Tab>("signin")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  // Sign in fields
  const [siEmail, setSiEmail] = useState("")
  const [siPassword, setSiPassword] = useState("")

  // Sign up fields
  const [suEmail, setSuEmail] = useState("")
  const [suPassword, setSuPassword] = useState("")
  const [suUsername, setSuUsername] = useState("")

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      await signIn(siEmail, siPassword)
      router.push(redirect)
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Invalid credentials. Please try again."))
    } finally {
      setLoading(false)
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (suUsername.trim().length < 3) {
      setError("Username must be at least 3 characters.")
      return
    }
    if (suPassword.length < 6) {
      setError("Password must be at least 6 characters.")
      return
    }
    setLoading(true)
    try {
      await signUp(suEmail, suPassword, suUsername)
      router.push(redirect)
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Registration failed. Please try again."))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 mb-8">
        <BookOpen className="size-5 text-primary" />
        <span className="font-semibold tracking-tight text-foreground text-lg">
          Manga<span className="text-primary">Den</span>
        </span>
      </Link>

      <div className="w-full max-w-sm">
        {/* Tab switcher */}
        <div className="flex rounded-lg border border-border bg-card p-1 mb-6">
          <button
            onClick={() => { setTab("signin"); setError("") }}
            className={cn(
              "flex-1 py-2 text-sm font-medium rounded-md transition-colors",
              tab === "signin"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Sign In
          </button>
          <button
            onClick={() => { setTab("signup"); setError("") }}
            className={cn(
              "flex-1 py-2 text-sm font-medium rounded-md transition-colors",
              tab === "signup"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Sign Up
          </button>
        </div>

        {/* Error */}
        {error && (
          <p className="mb-4 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
            {error}
          </p>
        )}

        {/* Sign In Form */}
        {tab === "signin" && (
          <form onSubmit={handleSignIn} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="si-email" className="text-xs font-medium text-muted-foreground">
                Email
              </label>
              <input
                id="si-email"
                type="email"
                required
                value={siEmail}
                onChange={(e) => setSiEmail(e.target.value)}
                placeholder="you@example.com"
                className="h-10 rounded-md border border-border bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="si-password" className="text-xs font-medium text-muted-foreground">
                Password
              </label>
              <div className="relative">
                <input
                  id="si-password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={siPassword}
                  onChange={(e) => setSiPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-10 w-full rounded-md border border-border bg-card px-3 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 h-10 rounded-md bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {loading && <Loader2 className="size-4 animate-spin" />}
              Sign In
            </button>
          </form>
        )}

        {/* Sign Up Form */}
        {tab === "signup" && (
          <form onSubmit={handleSignUp} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="su-username" className="text-xs font-medium text-muted-foreground">
                Username
              </label>
              <input
                id="su-username"
                type="text"
                required
                value={suUsername}
                onChange={(e) => setSuUsername(e.target.value)}
                placeholder="coolreader"
                className="h-10 rounded-md border border-border bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="su-email" className="text-xs font-medium text-muted-foreground">
                Email
              </label>
              <input
                id="su-email"
                type="email"
                required
                value={suEmail}
                onChange={(e) => setSuEmail(e.target.value)}
                placeholder="you@example.com"
                className="h-10 rounded-md border border-border bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="su-password" className="text-xs font-medium text-muted-foreground">
                Password
              </label>
              <div className="relative">
                <input
                  id="su-password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={suPassword}
                  onChange={(e) => setSuPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  className="h-10 w-full rounded-md border border-border bg-card px-3 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 h-10 rounded-md bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {loading && <Loader2 className="size-4 animate-spin" />}
              Create Account
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-xs text-muted-foreground">
          By continuing, you agree to our terms of service.
        </p>
      </div>
    </div>
  )
}
