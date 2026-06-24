"use client"

import { useState, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import useSWR from "swr"
import { ArrowLeft, Loader2, Layers } from "lucide-react"
import { SectionHeader, ApiNotice, AdminButton, useToast } from "@/components/admin/admin-ui"
import { MangaForm } from "@/components/admin/manga-form"
import { adminManga } from "@/lib/admin-api"
import { getErrorMessage } from "@/lib/api"
import type { MangaInput } from "@/lib/admin-types"

export default function EditMangaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { toast } = useToast()
  const [submitting, setSubmitting] = useState(false)

  const { data, error, isLoading } = useSWR(
    ["admin-manga-get", id],
    () => adminManga.get(id),
    { shouldRetryOnError: false }
  )

  const m = data?.data

  async function handleSubmit(values: MangaInput) {
    setSubmitting(true)
    try {
      await adminManga.update(id, values)
      toast("Changes saved.", "success")
      router.push("/admin/manga")
    } catch (err) {
      toast(getErrorMessage(err, "Failed to save changes. The update endpoint may not be implemented yet."), "error")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <Link
        href="/admin/manga"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
      >
        <ArrowLeft className="size-4" />
        Back to Manga
      </Link>

      <SectionHeader
        title={m ? `Edit: ${m.title}` : "Edit Manga"}
        description="Update title details and metadata."
        action={
          m && (
            <Link href={`/admin/chapters?manga=${m.slug}`}>
              <AdminButton variant="outline">
                <Layers className="size-4" />
                Manage Chapters
              </AdminButton>
            </Link>
          )
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="size-5 text-primary animate-spin" />
        </div>
      ) : error || !m ? (
        <div className="flex flex-col gap-4">
          <ApiNotice message="Could not load this manga. GET /api/admin/manga/:id is not implemented yet — see ADMIN_API.md. Once available, this form will be pre-filled with the title's current data." />
          <div className="rounded-lg border border-dashed border-border py-16 text-center">
            <p className="text-sm text-muted-foreground">Manga data unavailable.</p>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card p-5 sm:p-6">
          <MangaForm
            initial={{
              title: m.title,
              slug: m.slug,
              description: m.description ?? "",
              coverUrl: m.coverUrl,
              bannerUrl: m.bannerUrl ?? "",
              author: m.author,
              artist: m.artist ?? "",
              status: m.status,
              type: m.type,
              releaseYear: m.releaseYear,
              isNsfw: m.isNsfw,
            }}
            submitLabel="Save Changes"
            submitting={submitting}
            onSubmit={handleSubmit}
            onCancel={() => router.push("/admin/manga")}
          />
        </div>
      )}
    </div>
  )
}
