"use client"

import { useState } from "react"
import { GripVertical, Trash2, Plus, ImageOff, ArrowUp, ArrowDown } from "lucide-react"
import { Modal, Field, TextInput, AdminButton } from "./admin-ui"
import { cn } from "@/lib/utils"
import type { ChapterInput } from "@/lib/admin-types"
import type { Chapter } from "@/lib/types"

/**
 * Create/edit a chapter, including its ordered list of page image URLs.
 * Reordering is done with up/down controls (no drag dependency required).
 */
export function ChapterEditor({
  open,
  onClose,
  onSubmit,
  submitting,
  mangaId,
  initial,
  initialPages,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (input: ChapterInput) => void
  submitting: boolean
  mangaId: string
  initial?: Chapter | null
  initialPages?: string[]
}) {
  const [number, setNumber] = useState<string>(initial ? String(initial.number) : "")
  const [title, setTitle] = useState(initial?.title ?? "")
  const [pages, setPages] = useState<string[]>(initialPages ?? [])
  const [newPage, setNewPage] = useState("")
  const [bulk, setBulk] = useState("")
  const [error, setError] = useState("")

  function addPage() {
    const url = newPage.trim()
    if (!url) return
    setPages((p) => [...p, url])
    setNewPage("")
  }

  function addBulk() {
    const urls = bulk
      .split(/[\n,]+/)
      .map((u) => u.trim())
      .filter(Boolean)
    if (urls.length === 0) return
    setPages((p) => [...p, ...urls])
    setBulk("")
  }

  function removePage(i: number) {
    setPages((p) => p.filter((_, idx) => idx !== i))
  }

  function move(i: number, dir: -1 | 1) {
    setPages((p) => {
      const next = [...p]
      const j = i + dir
      if (j < 0 || j >= next.length) return p
      ;[next[i], next[j]] = [next[j], next[i]]
      return next
    })
  }

  function handleSubmit() {
    const num = Number(number)
    if (!number || Number.isNaN(num) || num < 0) {
      setError("Enter a valid chapter number.")
      return
    }
    setError("")
    onSubmit({ mangaId, number: num, title: title.trim() || undefined, pages })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? `Edit Chapter ${initial.number}` : "New Chapter"}
      description="Set the chapter number, optional title, and page images."
      size="lg"
    >
      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-3 gap-4">
          <Field label="Number" htmlFor="ch-number" required error={error}>
            <TextInput
              id="ch-number"
              type="number"
              step="0.1"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              placeholder="1"
            />
          </Field>
          <div className="col-span-2">
            <Field label="Title" htmlFor="ch-title" hint="Optional chapter title.">
              <TextInput
                id="ch-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. The Beginning"
              />
            </Field>
          </div>
        </div>

        {/* Pages */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-foreground">Pages ({pages.length})</span>
          </div>

          {/* Add single page */}
          <div className="flex gap-2">
            <TextInput
              value={newPage}
              onChange={(e) => setNewPage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  addPage()
                }
              }}
              placeholder="https://...page-image.jpg"
            />
            <AdminButton variant="outline" onClick={addPage} type="button">
              <Plus className="size-4" />
              Add
            </AdminButton>
          </div>

          {/* Page list */}
          {pages.length > 0 ? (
            <ul className="flex flex-col gap-1.5 max-h-64 overflow-y-auto rounded-md border border-border p-2">
              {pages.map((url, i) => (
                <li
                  key={`${url}-${i}`}
                  className="flex items-center gap-2 rounded-md bg-card px-2 py-1.5"
                >
                  <GripVertical className="size-3.5 text-muted-foreground/40 shrink-0" />
                  <span className="text-xs font-medium text-muted-foreground tabular-nums w-6 text-center shrink-0">
                    {i + 1}
                  </span>
                  <PageThumb url={url} />
                  <span className="flex-1 text-xs text-muted-foreground truncate">{url}</span>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => move(i, -1)}
                      disabled={i === 0}
                      className="p-1 rounded text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                      aria-label="Move up"
                    >
                      <ArrowUp className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(i, 1)}
                      disabled={i === pages.length - 1}
                      className="p-1 rounded text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                      aria-label="Move down"
                    >
                      <ArrowDown className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removePage(i)}
                      className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors"
                      aria-label="Remove page"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-md border border-dashed border-border py-6 text-center">
              <p className="text-xs text-muted-foreground">No pages added yet.</p>
            </div>
          )}

          {/* Bulk add */}
          <details className="rounded-md border border-border bg-card">
            <summary className="cursor-pointer px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground">
              Bulk add pages
            </summary>
            <div className="flex flex-col gap-2 px-3 pb-3">
              <textarea
                value={bulk}
                onChange={(e) => setBulk(e.target.value)}
                placeholder={"Paste one image URL per line (or comma-separated)"}
                rows={4}
                className={cn(
                  "w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-y leading-relaxed"
                )}
              />
              <div>
                <AdminButton variant="outline" size="sm" onClick={addBulk} type="button">
                  <Plus className="size-3.5" />
                  Append pages
                </AdminButton>
              </div>
            </div>
          </details>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <AdminButton variant="ghost" onClick={onClose} type="button">
            Cancel
          </AdminButton>
          <AdminButton onClick={handleSubmit} loading={submitting}>
            {initial ? "Save Chapter" : "Create Chapter"}
          </AdminButton>
        </div>
      </div>
    </Modal>
  )
}

function PageThumb({ url }: { url: string }) {
  const [err, setErr] = useState(false)
  return (
    <div className="size-8 rounded overflow-hidden bg-background border border-border shrink-0 flex items-center justify-center">
      {!err ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url || "/placeholder.svg"} alt="" className="h-full w-full object-cover" onError={() => setErr(true)} />
      ) : (
        <ImageOff className="size-3.5 text-muted-foreground/40" />
      )}
    </div>
  )
}
