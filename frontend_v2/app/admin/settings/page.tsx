"use client"

import { useState, useEffect } from "react"
import useSWR from "swr"
import { Settings, Save, Loader2, Globe, ShieldCheck, ToggleLeft, Wrench } from "lucide-react"
import {
  SectionHeader,
  AdminButton,
  ApiNotice,
  Field,
  TextInput,
  TextArea,
  Select,
  Toggle,
  useToast,
} from "@/components/admin/admin-ui"
import { adminSettings } from "@/lib/admin-api"
import { getErrorMessage } from "@/lib/api"
import type { SiteSettings } from "@/lib/admin-types"

const DEFAULTS: SiteSettings = {
  siteName: "MangaDen",
  siteDescription: "Discover and read thousands of manga, manhwa, manhua, and webtoons.",
  maintenanceMode: false,
  maintenanceMessage: "We'll be back shortly. MangaDen is undergoing scheduled maintenance.",
  allowRegistration: true,
  requireEmailVerification: false,
  showNsfwToGuests: false,
  defaultReadingMode: "scroll",
  featuredMangaSlug: "",
  features: {
    comments: true,
    ratings: true,
    bookmarks: true,
    readingProgress: true,
  },
}

export default function AdminSettingsPage() {
  const { toast } = useToast()
  const [settings, setSettings] = useState<SiteSettings>(DEFAULTS)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)

  const { data, error, isLoading } = useSWR("admin-settings", () => adminSettings.get(), {
    shouldRetryOnError: false,
  })

  // Hydrate local form state once settings load.
  useEffect(() => {
    if (data?.data) {
      setSettings({ ...DEFAULTS, ...data.data, features: { ...DEFAULTS.features, ...data.data.features } })
      setDirty(false)
    }
  }, [data])

  function update<K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) {
    setSettings((s) => ({ ...s, [key]: value }))
    setDirty(true)
  }

  function updateFeature(key: keyof SiteSettings["features"], value: boolean) {
    setSettings((s) => ({ ...s, features: { ...s.features, [key]: value } }))
    setDirty(true)
  }

  async function handleSave() {
    setSaving(true)
    try {
      await adminSettings.update(settings)
      toast("Settings saved.", "success")
      setDirty(false)
    } catch (err) {
      toast(getErrorMessage(err, "Failed to save settings. PUT /api/admin/settings may not be implemented yet."), "error")
    } finally {
      setSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="size-5 text-primary animate-spin" />
      </div>
    )
  }

  return (
    <div>
      <SectionHeader
        title="Site Settings"
        description="Configure global behavior, access, and features."
        action={
          <AdminButton onClick={handleSave} loading={saving} disabled={!dirty}>
            <Save className="size-4" />
            Save Changes
          </AdminButton>
        }
      />

      {error && (
        <div className="mb-6">
          <ApiNotice message="The settings endpoint (GET /api/admin/settings) is not implemented yet, so defaults are shown. Saving calls PUT /api/admin/settings. See ADMIN_API.md for the full settings object." />
        </div>
      )}

      <div className="flex flex-col gap-6">
        {/* General */}
        <SettingsCard icon={Globe} title="General" description="Public identity of your site.">
          <Field label="Site Name" htmlFor="siteName">
            <TextInput id="siteName" value={settings.siteName} onChange={(e) => update("siteName", e.target.value)} />
          </Field>
          <Field label="Site Description" htmlFor="siteDescription" hint="Used for SEO and social previews.">
            <TextArea
              id="siteDescription"
              value={settings.siteDescription}
              onChange={(e) => update("siteDescription", e.target.value)}
              rows={3}
            />
          </Field>
          <Field label="Featured Manga Slug" htmlFor="featured" hint="Shown in the homepage hero. Leave blank to disable.">
            <TextInput
              id="featured"
              value={settings.featuredMangaSlug ?? ""}
              onChange={(e) => update("featuredMangaSlug", e.target.value)}
              placeholder="one-piece"
            />
          </Field>
          <Field label="Default Reading Mode" htmlFor="readingMode">
            <Select
              id="readingMode"
              value={settings.defaultReadingMode}
              onChange={(e) => update("defaultReadingMode", e.target.value as SiteSettings["defaultReadingMode"])}
            >
              <option value="scroll">Continuous scroll</option>
              <option value="paginated">Paginated</option>
            </Select>
          </Field>
        </SettingsCard>

        {/* Access */}
        <SettingsCard icon={ShieldCheck} title="Access & Registration" description="Control who can join and what guests see.">
          <Toggle
            checked={settings.allowRegistration}
            onChange={(v) => update("allowRegistration", v)}
            label="Allow new registrations"
            description="When off, the sign-up form is disabled."
          />
          <div className="border-t border-border" />
          <Toggle
            checked={settings.requireEmailVerification}
            onChange={(v) => update("requireEmailVerification", v)}
            label="Require email verification"
            description="New users must verify their email before reading."
          />
          <div className="border-t border-border" />
          <Toggle
            checked={settings.showNsfwToGuests}
            onChange={(v) => update("showNsfwToGuests", v)}
            label="Show NSFW titles to guests"
            description="When off, NSFW titles are hidden from logged-out visitors."
          />
        </SettingsCard>

        {/* Features */}
        <SettingsCard icon={ToggleLeft} title="Features" description="Toggle site capabilities on or off.">
          <Toggle
            checked={settings.features.bookmarks}
            onChange={(v) => updateFeature("bookmarks", v)}
            label="Bookmarks"
            description="Let users save titles to their library."
          />
          <div className="border-t border-border" />
          <Toggle
            checked={settings.features.readingProgress}
            onChange={(v) => updateFeature("readingProgress", v)}
            label="Reading progress"
            description="Track and resume where users left off."
          />
          <div className="border-t border-border" />
          <Toggle
            checked={settings.features.comments}
            onChange={(v) => updateFeature("comments", v)}
            label="Comments"
            description="Enable comments on manga and chapters."
          />
          <div className="border-t border-border" />
          <Toggle
            checked={settings.features.ratings}
            onChange={(v) => updateFeature("ratings", v)}
            label="Ratings"
            description="Allow users to rate titles."
          />
        </SettingsCard>

        {/* Maintenance */}
        <SettingsCard
          icon={Wrench}
          title="Maintenance Mode"
          description="Temporarily take the public site offline."
          danger={settings.maintenanceMode}
        >
          <Toggle
            checked={settings.maintenanceMode}
            onChange={(v) => update("maintenanceMode", v)}
            label="Enable maintenance mode"
            description="Visitors see a maintenance page; admins retain access."
          />
          {settings.maintenanceMode && (
            <Field label="Maintenance Message" htmlFor="maintMsg">
              <TextArea
                id="maintMsg"
                value={settings.maintenanceMessage}
                onChange={(e) => update("maintenanceMessage", e.target.value)}
                rows={2}
              />
            </Field>
          )}
        </SettingsCard>
      </div>

      {/* Sticky save bar on mobile */}
      <div className="flex justify-end mt-6">
        <AdminButton onClick={handleSave} loading={saving} disabled={!dirty}>
          <Save className="size-4" />
          Save Changes
        </AdminButton>
      </div>
    </div>
  )
}

function SettingsCard({
  icon: Icon,
  title,
  description,
  danger,
  children,
}: {
  icon: typeof Settings
  title: string
  description: string
  danger?: boolean
  children: React.ReactNode
}) {
  return (
    <section
      className={
        "rounded-lg border bg-card " + (danger ? "border-destructive/40" : "border-border")
      }
    >
      <div className="flex items-start gap-3 border-b border-border px-5 py-4">
        <span className={"flex size-8 items-center justify-center rounded-md shrink-0 " + (danger ? "bg-destructive/15 text-destructive" : "bg-primary/15 text-primary")}>
          <Icon className="size-4" />
        </span>
        <div className="flex flex-col gap-0.5">
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="flex flex-col gap-4 p-5">{children}</div>
    </section>
  )
}
