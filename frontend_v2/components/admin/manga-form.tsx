"use client"

import { useState } from "react"
import { ImageOff } from "lucide-react"
import { Field, TextInput, TextArea, Select, Toggle, AdminButton } from "./admin-ui"
import type { MangaInput } from "@/lib/admin-types"
import type { Manga } from "@/lib/types"

const STATUSES: Manga["status"][] = ["ongoing", "completed", "hiatus", "cancelled"]
const TYPES: Manga["type"][] = ["manga", "manhwa", "manhua", "webtoon"]

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

const EMPTY: MangaInput = {
  title: "",
  slug: "",
  description: "",
  coverUrl: "",
  bannerUrl: "",
  author: "",
  artist: "",
  status: "ongoing",
  type: "manga",
  releaseYear: undefined,
  isNsfw: false,
  genres: [],
}

export function MangaForm({
  initial,
  submitLabel,
  submitting,
  onSubmit,
  onCancel,
}: {
  initial?: Partial<MangaInput>
  submitLabel: string
  submitting: boolean
  onSubmit: (values: MangaInput) => void
  onCancel?: () => void
}) {
  const [values, setValues] = useState<MangaInput>({ ...EMPTY, ...initial })
  const [slugTouched, setSlugTouched] = useState(!!initial?.slug)
  const [genresText, setGenresText] = useState((initial?.genres ?? []).join(", "))
  const [errors, setErrors] = useState<Record<string, string>>({})

  function set<K extends keyof MangaInput>(key: K, value: MangaInput[K]) {
    setValues((v) => ({ ...v, [key]: value }))
  }

  function handleTitleChange(title: string) {
    set("title", title)
    if (!slugTouched) set("slug", slugify(title))
  }

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!values.title.trim()) e.title = "Title is required."
    if (!values.author.trim()) e.author = "Author is required."
    if (!values.coverUrl.trim()) e.coverUrl = "Cover image URL is required."
    if (values.releaseYear != null && (values.releaseYear < 1900 || values.releaseYear > 2100))
      e.releaseYear = "Enter a valid year."
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    const genres = genresText
      .split(",")
      .map((g) => g.trim())
      .filter(Boolean)
    onSubmit({ ...values, slug: values.slug || slugify(values.title), genres })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="grid sm:grid-cols-2 gap-5">
        <Field label="Title" htmlFor="title" required error={errors.title}>
          <TextInput
            id="title"
            value={values.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="e.g. One Piece"
          />
        </Field>
        <Field label="Slug" htmlFor="slug" hint="URL identifier. Auto-generated from the title." error={errors.slug}>
          <TextInput
            id="slug"
            value={values.slug}
            onChange={(e) => {
              setSlugTouched(true)
              set("slug", slugify(e.target.value))
            }}
            placeholder="one-piece"
          />
        </Field>
      </div>

      <Field label="Description" htmlFor="description">
        <TextArea
          id="description"
          value={values.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="Synopsis of the series..."
          rows={4}
        />
      </Field>

      <div className="grid sm:grid-cols-2 gap-5">
        <Field label="Author" htmlFor="author" required error={errors.author}>
          <TextInput
            id="author"
            value={values.author}
            onChange={(e) => set("author", e.target.value)}
            placeholder="Eiichiro Oda"
          />
        </Field>
        <Field label="Artist" htmlFor="artist" hint="Optional, if different from author.">
          <TextInput
            id="artist"
            value={values.artist ?? ""}
            onChange={(e) => set("artist", e.target.value)}
            placeholder="Artist name"
          />
        </Field>
      </div>

      <div className="grid sm:grid-cols-3 gap-5">
        <Field label="Type" htmlFor="type" required>
          <Select id="type" value={values.type} onChange={(e) => set("type", e.target.value as Manga["type"])}>
            {TYPES.map((t) => (
              <option key={t} value={t} className="capitalize">
                {t}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Status" htmlFor="status" required>
          <Select id="status" value={values.status} onChange={(e) => set("status", e.target.value as Manga["status"])}>
            {STATUSES.map((s) => (
              <option key={s} value={s} className="capitalize">
                {s}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Release Year" htmlFor="year" error={errors.releaseYear}>
          <TextInput
            id="year"
            type="number"
            value={values.releaseYear ?? ""}
            onChange={(e) => set("releaseYear", e.target.value ? Number(e.target.value) : undefined)}
            placeholder="1999"
          />
        </Field>
      </div>

      <Field label="Genres" htmlFor="genres" hint="Comma-separated, e.g. Action, Adventure, Fantasy">
        <TextInput
          id="genres"
          value={genresText}
          onChange={(e) => setGenresText(e.target.value)}
          placeholder="Action, Adventure, Fantasy"
        />
      </Field>

      <div className="grid sm:grid-cols-2 gap-5">
        <Field label="Cover Image URL" htmlFor="coverUrl" required error={errors.coverUrl}>
          <TextInput
            id="coverUrl"
            value={values.coverUrl}
            onChange={(e) => set("coverUrl", e.target.value)}
            placeholder="https://..."
          />
        </Field>
        <Field label="Banner Image URL" htmlFor="bannerUrl" hint="Optional wide banner for the detail page.">
          <TextInput
            id="bannerUrl"
            value={values.bannerUrl ?? ""}
            onChange={(e) => set("bannerUrl", e.target.value)}
            placeholder="https://..."
          />
        </Field>
      </div>

      {/* Cover preview */}
      <div className="flex items-center gap-4">
        <CoverPreview url={values.coverUrl} />
        <p className="text-xs text-muted-foreground">
          Cover preview. Images are referenced by URL; uploads can be added once a storage endpoint exists.
        </p>
      </div>

      <div className="rounded-md border border-border bg-card p-4">
        <Toggle
          checked={values.isNsfw}
          onChange={(v) => set("isNsfw", v)}
          label="Mark as NSFW"
          description="Hidden from guests and flagged with a content warning."
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <AdminButton variant="ghost" onClick={onCancel} type="button">
            Cancel
          </AdminButton>
        )}
        <AdminButton type="submit" loading={submitting}>
          {submitLabel}
        </AdminButton>
      </div>
    </form>
  )
}

function CoverPreview({ url }: { url: string }) {
  const [error, setError] = useState(false)
  return (
    <div className="w-20 aspect-[2/3] rounded-md overflow-hidden bg-card border border-border shrink-0 flex items-center justify-center">
      {url && !error ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt="Cover preview"
          className="h-full w-full object-cover"
          onError={() => setError(true)}
        />
      ) : (
        <ImageOff className="size-5 text-muted-foreground/40" />
      )}
    </div>
  )
}
