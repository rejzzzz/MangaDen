"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import { SWRConfig } from "swr"
import type { User, Session } from "./types"
import { auth } from "./api"

interface AuthContextValue {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, username: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function storeSession(session: Session) {
  localStorage.setItem("access_token", session.access_token)
  localStorage.setItem("refresh_token", session.refresh_token)
}

function clearSession() {
  localStorage.removeItem("access_token")
  localStorage.removeItem("refresh_token")
}

/**
 * Global SWR config:
 * - Don't retry on 401 / 404 — these are expected for unauthenticated or
 *   missing resources, not transient failures.
 * - Dedupe interval of 5 s prevents redundant refetches when multiple
 *   components mount with the same key.
 */
function shouldRetry(
  err: unknown,
  retryCount: number
): boolean {
  const status = (err as { status?: number })?.status
  if (status === 401 || status === 403 || status === 404) return false
  return retryCount < 3
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchMe = useCallback(async () => {
    // Avoid a round-trip for anonymous visitors who have no token stored.
    const hasToken =
      typeof window !== "undefined" && !!localStorage.getItem("access_token")
    if (!hasToken) {
      setUser(null)
      setLoading(false)
      return
    }
    try {
      const res = await auth.me()
      if (res.success) setUser(res.data.user)
      else setUser(null)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMe()
  }, [fetchMe])

  const signIn = async (email: string, password: string): Promise<void> => {
    const res = await auth.signIn(email, password)
    if (!res.success) throw new Error("Sign in failed")
    storeSession(res.data.session)
    setUser(res.data.user)
  }

  const signUp = async (email: string, password: string, username: string): Promise<void> => {
    const res = await auth.signUp(email, password, username)
    if (!res.success) throw new Error("Sign up failed")
    storeSession(res.data.session)
    setUser(res.data.user)
  }

  const signOut = async (): Promise<void> => {
    try {
      await auth.signOut()
    } catch {
      // ignore — clear tokens regardless of server response
    }
    clearSession()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      <SWRConfig
        value={{
          dedupingInterval: 5000,
          onErrorRetry: (_err, _key, _config, revalidate, { retryCount }) => {
            if (!shouldRetry(_err, retryCount)) return
            setTimeout(() => revalidate({ retryCount }), Math.min(1000 * 2 ** retryCount, 30000))
          },
        }}
      >
        {children}
      </SWRConfig>
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider")
  return ctx
}
