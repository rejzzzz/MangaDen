"use client"

import React, { createContext, useContext, useState, useCallback, useEffect } from "react"
import { X, Loader2, AlertTriangle, CheckCircle2, Info, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

// ===========================================================================
// Stat Card
// ===========================================================================

interface StatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  /** Optional delta string, e.g. "+12% this month". */
  delta?: string
  deltaPositive?: boolean
  loading?: boolean
}

export function StatCard({ label, value, icon: Icon, delta, deltaPositive, loading }: StatCardProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <Icon className="size-4 text-primary" aria-hidden="true" />
      </div>
      {loading ? (
        <div className="h-7 w-20 rounded bg-muted animate-pulse" />
      ) : (
        <span className="text-2xl font-semibold text-foreground tabular-nums">{value}</span>
      )}
      {delta && !loading && (
        <span className={cn("text-xs", deltaPositive ? "text-green-400" : "text-muted-foreground")}>
          {delta}
        </span>
      )}
    </div>
  )
}

// ===========================================================================
// Section Header
// ===========================================================================

export function SectionHeader({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
      <div className="flex flex-col gap-0.5">
        <h1 className="text-xl font-semibold text-foreground">{title}</h1>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  )
}

// ===========================================================================
// Badge
// ===========================================================================

const BADGE_VARIANTS: Record<string, string> = {
  neutral: "bg-muted text-muted-foreground",
  green: "bg-green-500/15 text-green-400",
  blue: "bg-blue-500/15 text-blue-400",
  yellow: "bg-yellow-500/15 text-yellow-400",
  red: "bg-red-500/15 text-red-400",
  primary: "bg-primary/15 text-primary",
}

export function Badge({
  children,
  variant = "neutral",
  className,
}: {
  children: React.ReactNode
  variant?: keyof typeof BADGE_VARIANTS | string
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium capitalize leading-none",
        BADGE_VARIANTS[variant] ?? BADGE_VARIANTS.neutral,
        className
      )}
    >
      {children}
    </span>
  )
}

// ===========================================================================
// Button (admin-scoped, hand-rolled to match site conventions)
// ===========================================================================

type BtnVariant = "primary" | "outline" | "ghost" | "destructive"
type BtnSize = "sm" | "md"

const BTN_VARIANTS: Record<BtnVariant, string> = {
  primary: "bg-primary text-primary-foreground hover:bg-primary/90",
  outline: "border border-border bg-card text-muted-foreground hover:text-foreground hover:border-primary/50",
  ghost: "text-muted-foreground hover:text-foreground hover:bg-card",
  destructive: "bg-destructive/15 text-destructive hover:bg-destructive/25",
}

const BTN_SIZES: Record<BtnSize, string> = {
  sm: "h-8 px-2.5 text-xs gap-1.5",
  md: "h-9 px-3.5 text-sm gap-2",
}

export function AdminButton({
  children,
  variant = "primary",
  size = "md",
  loading,
  className,
  type = "button",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: BtnVariant
  size?: BtnSize
  loading?: boolean
}) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
        BTN_VARIANTS[variant],
        BTN_SIZES[size],
        className
      )}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && <Loader2 className="size-3.5 animate-spin" />}
      {children}
    </button>
  )
}

// ===========================================================================
// Form fields
// ===========================================================================

export function Field({
  label,
  htmlFor,
  required,
  hint,
  error,
  children,
}: {
  label: string
  htmlFor?: string
  required?: boolean
  hint?: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-xs font-medium text-foreground">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </label>
      {children}
      {hint && !error && <span className="text-[11px] text-muted-foreground">{hint}</span>}
      {error && <span className="text-[11px] text-destructive">{error}</span>}
    </div>
  )
}

const inputBase =
  "h-9 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors"

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(inputBase, props.className)} />
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(inputBase, "h-auto min-h-20 py-2 resize-y leading-relaxed", props.className)}
    />
  )
}

export function Select({
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className={cn(inputBase, "cursor-pointer", props.className)}>
      {children}
    </select>
  )
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  description?: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex items-start justify-between gap-4 w-full text-left group"
    >
      <span className="flex flex-col gap-0.5">
        <span className="text-sm font-medium text-foreground">{label}</span>
        {description && <span className="text-xs text-muted-foreground">{description}</span>}
      </span>
      <span
        className={cn(
          "relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors",
          checked ? "bg-primary" : "bg-muted"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 size-4 rounded-full bg-background transition-transform",
            checked && "translate-x-4"
          )}
        />
      </span>
    </button>
  )
}

// ===========================================================================
// Modal
// ===========================================================================

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  size = "md",
}: {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: React.ReactNode
  size?: "sm" | "md" | "lg"
}) {
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKey)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = ""
    }
  }, [open, onClose])

  if (!open) return null

  const sizes = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl" }

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "relative z-10 my-8 w-full rounded-lg border border-border bg-popover shadow-2xl",
          sizes[size]
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div className="flex flex-col gap-0.5">
            <h2 className="text-base font-semibold text-foreground">{title}</h2>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-card transition-colors"
            aria-label="Close dialog"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  )
}

// ===========================================================================
// Confirm Dialog
// ===========================================================================

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  destructive = false,
  loading = false,
}: {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmLabel?: string
  destructive?: boolean
  loading?: boolean
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3">
          {destructive && (
            <AlertTriangle className="size-5 text-destructive shrink-0 mt-0.5" aria-hidden="true" />
          )}
          <p className="text-sm text-muted-foreground leading-relaxed">{message}</p>
        </div>
        <div className="flex justify-end gap-2">
          <AdminButton variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </AdminButton>
          <AdminButton
            variant={destructive ? "destructive" : "primary"}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </AdminButton>
        </div>
      </div>
    </Modal>
  )
}

// ===========================================================================
// Toast system
// ===========================================================================

type ToastKind = "success" | "error" | "info"
interface Toast {
  id: number
  kind: ToastKind
  message: string
}

interface ToastContextValue {
  toast: (message: string, kind?: ToastKind) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((message: string, kind: ToastKind = "info") => {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { id, kind, message }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[200] flex flex-col gap-2 w-full max-w-xs">
        {toasts.map((t) => {
          const Icon = t.kind === "success" ? CheckCircle2 : t.kind === "error" ? AlertTriangle : Info
          const color =
            t.kind === "success"
              ? "text-green-400"
              : t.kind === "error"
              ? "text-destructive"
              : "text-primary"
          return (
            <div
              key={t.id}
              role="status"
              className="flex items-start gap-2.5 rounded-md border border-border bg-popover px-3.5 py-3 shadow-xl animate-in slide-in-from-right-4"
            >
              <Icon className={cn("size-4 shrink-0 mt-0.5", color)} aria-hidden="true" />
              <span className="text-sm text-foreground leading-snug">{t.message}</span>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error("useToast must be used inside ToastProvider")
  return ctx
}

// ===========================================================================
// Data Table
// ===========================================================================

export interface Column<T> {
  key: string
  header: string
  /** Render the cell. Receives the row. */
  cell: (row: T) => React.ReactNode
  className?: string
  /** Hide on small screens. */
  hideOnMobile?: boolean
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  loading,
  emptyMessage = "No records found.",
  emptyIcon: EmptyIcon,
  skeletonRows = 8,
}: {
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T) => string
  loading?: boolean
  emptyMessage?: string
  emptyIcon?: LucideIcon
  skeletonRows?: number
}) {
  if (loading) {
    return (
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="divide-y divide-border">
          {Array.from({ length: skeletonRows }).map((_, i) => (
            <div key={i} className="h-14 bg-card animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border py-16 flex flex-col items-center gap-3 text-center">
        {EmptyIcon && <EmptyIcon className="size-8 text-muted-foreground/30" />}
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-card">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  "px-4 py-3 text-left text-xs font-medium text-muted-foreground whitespace-nowrap",
                  col.hideOnMobile && "hidden md:table-cell",
                  col.className
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row) => (
            <tr key={rowKey(row)} className="hover:bg-card/50 transition-colors">
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={cn(
                    "px-4 py-3 text-foreground align-middle",
                    col.hideOnMobile && "hidden md:table-cell",
                    col.className
                  )}
                >
                  {col.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ===========================================================================
// Pagination
// ===========================================================================

export function Pagination({
  page,
  hasNext,
  onPrev,
  onNext,
}: {
  page: number
  hasNext: boolean
  onPrev: () => void
  onNext: () => void
}) {
  return (
    <div className="flex items-center justify-center gap-3 mt-6">
      <AdminButton variant="outline" size="sm" onClick={onPrev} disabled={page === 1}>
        Previous
      </AdminButton>
      <span className="text-sm text-muted-foreground tabular-nums">Page {page}</span>
      <AdminButton variant="outline" size="sm" onClick={onNext} disabled={!hasNext}>
        Next
      </AdminButton>
    </div>
  )
}

// ===========================================================================
// Not-implemented notice — shown when an endpoint isn't built yet
// ===========================================================================

export function ApiNotice({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2.5 rounded-md border border-yellow-500/30 bg-yellow-500/5 px-3.5 py-3 text-xs text-yellow-200/90">
      <Info className="size-4 shrink-0 mt-0.5 text-yellow-400" aria-hidden="true" />
      <span className="leading-relaxed">{message}</span>
    </div>
  )
}
