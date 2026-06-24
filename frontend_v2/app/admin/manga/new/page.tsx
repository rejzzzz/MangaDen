"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { SectionHeader, ApiNotice, useToast } from "@/components/admin/admin-ui"
import { MangaForm } from "@/components/admin/manga-form"
import { adminManga } from "@/lib/admin-api"
import { getErrorMessage } from "@/lib/api"
import type { MangaInput } from "@/lib/admin-types"

export default function NewMangaPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(values: MangaInput) {
    setSubmitting(true)
    try {
      const res = await adminManga.create(values)
      toast(`Created "${res.data.title}".`, "success")
      router.push("/admin/manga")
    } catch (err) {
      toast(getErrorMessage(err, "Failed to create manga. The create endpoint may not be implemented yet."), "error")
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

      <SectionHeader title="Add Manga" description="Create a new title in your catalog." />

      <div className="mb-6">
        <ApiNotice message="Submitting calls POST /api/admin/manga, which is not implemented yet. See ADMIN_API.md for the expected request body and response." />
      </div>

      <div className="rounded-lg border border-border bg-card p-5 sm:p-6">
        <MangaForm
          submitLabel="Create Manga"
          submitting={submitting}
          onSubmit={handleSubmit}
          onCancel={() => router.push("/admin/manga")}
        />
      </div>
    </div>
  )
}
