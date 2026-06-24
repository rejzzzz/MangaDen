"use client"

import { Suspense, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import useSWR from "swr"
import {
  Layers,
  Search,
  Plus,
  Pencil,
  Trash2,
  ArrowLeft,
  Loader2,
  FileImage,
} from "lucide-react"
import {
  SectionHeader,
  AdminButton,
  DataTable,
  ConfirmDialog,
  TextInput,
  useToast,
  type Column,
} from "@/components/admin/admin-ui"
import { ChapterEditor } from "@/components/admin/chapter-editor"
import { adminChapters } from "@/lib/admin-api"
import { manga as mangaApi, chapters as chaptersApi, getErrorMessage } from "@/lib/api"
import type { Chapter, Manga } from "@/lib/types"
import type { ChapterInput } from "@/lib/admin-types"

export default function AdminChaptersPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-24"><Loader2 className="size-5 text-primary animate-spin" /></div>}>
      <ChaptersContent />
    </Suspense>
  )
}

function ChaptersContent() {
  const searchParams = useSearchParams()
  const mangaSlug = searchParams.get("manga")

  if (!mangaSlug) {
    return <MangaPicker />
  }
  return <ChapterManager mangaSlug={mangaSlug} />
}

// ---------------------------------------------------------------------------
// Manga picker — shown when no ?manga= slug is selected
// ---------------------------------------------------------------------------

function MangaPicker() {
  const router = useRouter()
  const [search, setSearch] = useState("")

  const { data, isLoading } = useSWR(
    ["chapters-manga-picker", search],
    () => mangaApi.list({ page: 1, limit: 30, search: search || undefined }),
    { shouldRetryOnError: false, keepPreviousData: true }
  )
  const rows = data?.data ?? []

  const columns: Column<Manga>[] = [
    {
      key: "title",
      header: "Title",
      cell: (m) => (
        <div className="flex items-center gap-3">
          <div className="w-8 aspect-[2/3] rounded overflow-hidden bg-card shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={m.coverUrl || "/placeholder.svg"} alt="" className="h-full w-full object-cover" />
          </div>
          <span className="font-medium text-foreground truncate max-w-56">{m.title}</span>
        </div>
      ),
    },
    {
      key: "type",
      header: "Type",
      hideOnMobile: true,
      cell: (m) => <span className="capitalize text-muted-foreground">{m.type}</span>,
    },
    {
      key: "action",
      header: "",
      className: "text-right",
      cell: (m) => (
        <AdminButton variant="outline" size="sm" onClick={() => router.push(`/admin/chapters?manga=${m.slug}`)}>
          <Layers className="size-3.5" />
          Chapters
        </AdminButton>
      ),
    },
  ]

  return (
    <div>
      <SectionHeader title="Chapters" description="Select a title to manage its chapters and pages." />
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
        <TextInput
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search manga..."
          className="pl-8"
        />
      </div>
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(m) => m.id}
        loading={isLoading}
        emptyMessage="No manga found."
        emptyIcon={Layers}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Chapter manager — for a selected manga
// ---------------------------------------------------------------------------

function ChapterManager({ mangaSlug }: { mangaSlug: string }) {
  const { toast } = useToast()

  const { data: mangaRes } = useSWR(["chapters-manga", mangaSlug], () => mangaApi.get(mangaSlug), {
    shouldRetryOnError: false,
  })
  const mangaTitle = mangaRes?.data.title ?? mangaSlug
  const mangaId = mangaRes?.data.id ?? ""

  const { data: chaptersRes, isLoading, mutate } = useSWR(
    ["chapters-list", mangaSlug],
    () => chaptersApi.list(mangaSlug),
    { shouldRetryOnError: false }
  )
  const rows = chaptersRes?.data ?? []

  const [editorOpen, setEditorOpen] = useState(false)
  const [editing, setEditing] = useState<Chapter | null>(null)
  const [editingPages, setEditingPages] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [toDelete, setToDelete] = useState<Chapter | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function openEditor(chapter: Chapter | null) {
    setEditing(chapter)
    setEditingPages([])
    setEditorOpen(true)
    // Best-effort: load existing pages for editing (public endpoint exists).
    if (chapter) {
      try {
        const res = await adminChapters.getPages(chapter.id)
        setEditingPages(res.data.pages.map((p) => p.imageUrl))
      } catch {
        // pages unavailable — editor still opens with an empty list
      }
    }
  }

  async function handleSubmit(input: ChapterInput) {
    setSubmitting(true)
    try {
      if (editing) {
        await adminChapters.update(editing.id, input)
        if (input.pages) await adminChapters.setPages(editing.id, input.pages)
        toast(`Chapter ${input.number} saved.`, "success")
      } else {
        await adminChapters.create({ ...input, mangaId })
        toast(`Chapter ${input.number} created.`, "success")
      }
      setEditorOpen(false)
      mutate()
    } catch (err) {
      toast(getErrorMessage(err, "Failed to save chapter. The admin chapter endpoints may not be implemented yet."), "error")
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!toDelete) return
    setDeleting(true)
    try {
      await adminChapters.remove(toDelete.id)
      toast(`Deleted Chapter ${toDelete.number}.`, "success")
      setToDelete(null)
      mutate()
    } catch (err) {
      toast(getErrorMessage(err, "Failed to delete chapter."), "error")
    } finally {
      setDeleting(false)
    }
  }

  const columns: Column<Chapter>[] = [
    {
      key: "number",
      header: "Ch.",
      className: "w-16",
      cell: (c) => <span className="font-medium text-foreground tabular-nums">{c.number}</span>,
    },
    {
      key: "title",
      header: "Title",
      cell: (c) => <span className="text-foreground">{c.title || <span className="text-muted-foreground/50">Untitled</span>}</span>,
    },
    {
      key: "pages",
      header: "Pages",
      hideOnMobile: true,
      cell: (c) => (
        <span className="inline-flex items-center gap-1.5 text-muted-foreground tabular-nums">
          <FileImage className="size-3.5" />
          {c.pageCount ?? 0}
        </span>
      ),
    },
    {
      key: "created",
      header: "Added",
      hideOnMobile: true,
      cell: (c) =>
        c.createdAt ? (
          <span className="text-muted-foreground text-xs">
            {new Date(c.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </span>
        ) : (
          <span className="text-muted-foreground/40">—</span>
        ),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      cell: (c) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => openEditor(c)}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-background transition-colors"
            aria-label={`Edit chapter ${c.number}`}
            title="Edit"
          >
            <Pencil className="size-4" />
          </button>
          <button
            onClick={() => setToDelete(c)}
            className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-background transition-colors"
            aria-label={`Delete chapter ${c.number}`}
            title="Delete"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <Link
        href="/admin/chapters"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
      >
        <ArrowLeft className="size-4" />
        All titles
      </Link>

      <SectionHeader
        title={mangaTitle}
        description={`${rows.length} chapter${rows.length === 1 ? "" : "s"}`}
        action={
          <AdminButton onClick={() => openEditor(null)} disabled={!mangaId}>
            <Plus className="size-4" />
            New Chapter
          </AdminButton>
        }
      />

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(c) => c.id}
        loading={isLoading}
        emptyMessage="No chapters yet. Add the first chapter to get started."
        emptyIcon={Layers}
      />

      {editorOpen && (
        <ChapterEditor
          open={editorOpen}
          onClose={() => setEditorOpen(false)}
          onSubmit={handleSubmit}
          submitting={submitting}
          mangaId={mangaId}
          initial={editing}
          initialPages={editingPages}
        />
      )}

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={handleDelete}
        title="Delete chapter"
        message={`Delete Chapter ${toDelete?.number}? All of its pages will be removed. This cannot be undone.`}
        confirmLabel="Delete"
        destructive
        loading={deleting}
      />
    </div>
  )
}
