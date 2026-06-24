"use client"

import { useState } from "react"
import Link from "next/link"
import useSWR from "swr"
import { BookText, Search, Plus, Pencil, Trash2, Layers, ExternalLink } from "lucide-react"
import {
  SectionHeader,
  AdminButton,
  DataTable,
  Pagination,
  Badge,
  ConfirmDialog,
  TextInput,
  Select,
  useToast,
  type Column,
} from "@/components/admin/admin-ui"
import { adminManga } from "@/lib/admin-api"
import { getErrorMessage } from "@/lib/api"
import type { Manga } from "@/lib/types"

const TYPES = ["", "manga", "manhwa", "manhua", "webtoon"]
const STATUSES = ["", "ongoing", "completed", "hiatus", "cancelled"]

const STATUS_VARIANT: Record<string, string> = {
  ongoing: "green",
  completed: "blue",
  hiatus: "yellow",
  cancelled: "red",
}

const PAGE_SIZE = 20

export default function AdminMangaPage() {
  const { toast } = useToast()
  const [search, setSearch] = useState("")
  const [type, setType] = useState("")
  const [status, setStatus] = useState("")
  const [page, setPage] = useState(1)
  const [toDelete, setToDelete] = useState<Manga | null>(null)
  const [deleting, setDeleting] = useState(false)

  const { data, isLoading, mutate } = useSWR(
    ["admin-manga", page, search, type, status],
    () =>
      adminManga.list({
        page,
        limit: PAGE_SIZE + 1,
        search: search || undefined,
        type: type || undefined,
        status: status || undefined,
      }),
    { shouldRetryOnError: false, keepPreviousData: true }
  )

  const raw = data?.data ?? []
  const hasNext = raw.length > PAGE_SIZE
  const rows = hasNext ? raw.slice(0, PAGE_SIZE) : raw

  async function handleDelete() {
    if (!toDelete) return
    setDeleting(true)
    try {
      await adminManga.remove(toDelete.id)
      toast(`Deleted "${toDelete.title}".`, "success")
      setToDelete(null)
      mutate()
    } catch (err) {
      toast(getErrorMessage(err, "Failed to delete manga."), "error")
    } finally {
      setDeleting(false)
    }
  }

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
          <div className="flex flex-col min-w-0">
            <span className="font-medium text-foreground truncate max-w-48">{m.title}</span>
            <span className="text-xs text-muted-foreground truncate">{m.author}</span>
          </div>
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
      key: "status",
      header: "Status",
      cell: (m) => <Badge variant={STATUS_VARIANT[m.status] ?? "neutral"}>{m.status}</Badge>,
    },
    {
      key: "views",
      header: "Views",
      hideOnMobile: true,
      cell: (m) => <span className="tabular-nums text-muted-foreground">{m.viewCount?.toLocaleString() ?? 0}</span>,
    },
    {
      key: "nsfw",
      header: "NSFW",
      hideOnMobile: true,
      cell: (m) => (m.isNsfw ? <Badge variant="red">NSFW</Badge> : <span className="text-muted-foreground/40">—</span>),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      cell: (m) => (
        <div className="flex items-center justify-end gap-1">
          <Link
            href={`/admin/chapters?manga=${m.slug}`}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-background transition-colors"
            aria-label={`Manage chapters for ${m.title}`}
            title="Chapters"
          >
            <Layers className="size-4" />
          </Link>
          <Link
            href={`/manga/${m.slug}`}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-background transition-colors"
            aria-label={`View ${m.title} on site`}
            title="View on site"
          >
            <ExternalLink className="size-4" />
          </Link>
          <Link
            href={`/admin/manga/${m.id}`}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-background transition-colors"
            aria-label={`Edit ${m.title}`}
            title="Edit"
          >
            <Pencil className="size-4" />
          </Link>
          <button
            onClick={() => setToDelete(m)}
            className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-background transition-colors"
            aria-label={`Delete ${m.title}`}
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
      <SectionHeader
        title="Manga"
        description="Create, edit, and remove titles in your catalog."
        action={
          <Link href="/admin/manga/new">
            <AdminButton>
              <Plus className="size-4" />
              Add Manga
            </AdminButton>
          </Link>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <TextInput
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder="Search by title..."
            className="pl-8"
          />
        </div>
        <Select
          value={type}
          onChange={(e) => {
            setType(e.target.value)
            setPage(1)
          }}
          aria-label="Filter by type"
          className="sm:w-40"
        >
          {TYPES.map((t) => (
            <option key={t} value={t}>
              {t ? t[0].toUpperCase() + t.slice(1) : "All Types"}
            </option>
          ))}
        </Select>
        <Select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value)
            setPage(1)
          }}
          aria-label="Filter by status"
          className="sm:w-40"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s ? s[0].toUpperCase() + s.slice(1) : "All Status"}
            </option>
          ))}
        </Select>
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(m) => m.id}
        loading={isLoading}
        emptyMessage="No manga found. Add your first title to get started."
        emptyIcon={BookText}
      />

      {(rows.length > 0 || page > 1) && (
        <Pagination
          page={page}
          hasNext={hasNext}
          onPrev={() => setPage((p) => Math.max(1, p - 1))}
          onNext={() => setPage((p) => p + 1)}
        />
      )}

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={handleDelete}
        title="Delete manga"
        message={`Are you sure you want to delete "${toDelete?.title}"? This will also remove all of its chapters and pages. This action cannot be undone.`}
        confirmLabel="Delete"
        destructive
        loading={deleting}
      />
    </div>
  )
}
