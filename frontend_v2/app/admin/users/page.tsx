"use client"

import { useState } from "react"
import useSWR from "swr"
import {
  Users,
  Search,
  Shield,
  ShieldOff,
  Ban,
  CircleCheck,
  Trash2,
  MoreVertical,
  UserCog,
} from "lucide-react"
import {
  SectionHeader,
  AdminButton,
  DataTable,
  Pagination,
  Badge,
  ConfirmDialog,
  ApiNotice,
  TextInput,
  Select,
  useToast,
  type Column,
} from "@/components/admin/admin-ui"
import { adminUsers } from "@/lib/admin-api"
import { getErrorMessage } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"
import type { AdminUser, UserStatus } from "@/lib/admin-types"

const ROLES = ["", "user", "admin"]
const STATUSES = ["", "active", "suspended", "banned"]

const STATUS_VARIANT: Record<UserStatus, string> = {
  active: "green",
  suspended: "yellow",
  banned: "red",
}

const PAGE_SIZE = 20

type PendingAction =
  | { kind: "delete"; user: AdminUser }
  | { kind: "ban"; user: AdminUser }
  | { kind: "unban"; user: AdminUser }
  | { kind: "promote"; user: AdminUser }
  | { kind: "demote"; user: AdminUser }
  | null

export default function AdminUsersPage() {
  const { toast } = useToast()
  const { user: currentUser } = useAuth()
  const [search, setSearch] = useState("")
  const [role, setRole] = useState("")
  const [status, setStatus] = useState("")
  const [page, setPage] = useState(1)
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [pending, setPending] = useState<PendingAction>(null)
  const [working, setWorking] = useState(false)

  const { data, error, isLoading, mutate } = useSWR(
    ["admin-users", page, search, role, status],
    () =>
      adminUsers.list({
        page,
        limit: PAGE_SIZE + 1,
        search: search || undefined,
        role: role || undefined,
        status: status || undefined,
      }),
    { shouldRetryOnError: false, keepPreviousData: true }
  )

  const raw = data?.data ?? []
  const hasNext = raw.length > PAGE_SIZE
  const rows = hasNext ? raw.slice(0, PAGE_SIZE) : raw

  async function runAction() {
    if (!pending) return
    setWorking(true)
    const { kind, user } = pending
    try {
      if (kind === "delete") {
        await adminUsers.remove(user.id)
        toast(`Deleted ${user.username}.`, "success")
      } else if (kind === "ban") {
        await adminUsers.setStatus(user.id, "banned")
        toast(`Banned ${user.username}.`, "success")
      } else if (kind === "unban") {
        await adminUsers.setStatus(user.id, "active")
        toast(`Reactivated ${user.username}.`, "success")
      } else if (kind === "promote") {
        await adminUsers.setRole(user.id, "admin")
        toast(`${user.username} is now an admin.`, "success")
      } else if (kind === "demote") {
        await adminUsers.setRole(user.id, "user")
        toast(`${user.username} is now a regular user.`, "success")
      }
      setPending(null)
      mutate()
    } catch (err) {
      toast(getErrorMessage(err, "Action failed. The admin users endpoints may not be implemented yet."), "error")
    } finally {
      setWorking(false)
    }
  }

  async function suspendToggle(user: AdminUser) {
    setOpenMenu(null)
    setWorking(true)
    try {
      const next = user.status === "suspended" ? "active" : "suspended"
      await adminUsers.setStatus(user.id, next)
      toast(next === "suspended" ? `Suspended ${user.username}.` : `Reactivated ${user.username}.`, "success")
      mutate()
    } catch (err) {
      toast(getErrorMessage(err, "Action failed."), "error")
    } finally {
      setWorking(false)
    }
  }

  const columns: Column<AdminUser>[] = [
    {
      key: "user",
      header: "User",
      cell: (u) => (
        <div className="flex items-center gap-3">
          <span className="flex size-8 items-center justify-center rounded-full bg-primary/15 text-primary shrink-0 overflow-hidden">
            {u.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={u.avatarUrl || "/placeholder.svg"} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-xs font-semibold uppercase">{u.username?.[0] ?? "?"}</span>
            )}
          </span>
          <div className="flex flex-col min-w-0">
            <span className="font-medium text-foreground truncate max-w-40">{u.username}</span>
            <span className="text-xs text-muted-foreground truncate max-w-40">{u.email}</span>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      cell: (u) => <Badge variant={u.role === "admin" ? "primary" : "neutral"}>{u.role}</Badge>,
    },
    {
      key: "status",
      header: "Status",
      cell: (u) => <Badge variant={STATUS_VARIANT[u.status] ?? "neutral"}>{u.status}</Badge>,
    },
    {
      key: "joined",
      header: "Joined",
      hideOnMobile: true,
      cell: (u) =>
        u.createdAt ? (
          <span className="text-xs text-muted-foreground">
            {new Date(u.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </span>
        ) : (
          <span className="text-muted-foreground/40">—</span>
        ),
    },
    {
      key: "actions",
      header: "",
      className: "text-right w-12",
      cell: (u) => {
        const isSelf = currentUser?.id === u.id
        return (
          <div className="relative inline-block text-left">
            <button
              onClick={() => setOpenMenu(openMenu === u.id ? null : u.id)}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-background transition-colors"
              aria-label={`Actions for ${u.username}`}
              aria-haspopup="true"
              aria-expanded={openMenu === u.id}
            >
              <MoreVertical className="size-4" />
            </button>
            {openMenu === u.id && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} aria-hidden="true" />
                <div
                  role="menu"
                  className="absolute right-0 top-full mt-1 z-20 w-44 rounded-md border border-border bg-popover shadow-xl py-1"
                >
                  {u.role === "admin" ? (
                    <MenuItem
                      icon={ShieldOff}
                      label="Remove admin"
                      onClick={() => {
                        setOpenMenu(null)
                        setPending({ kind: "demote", user: u })
                      }}
                      disabled={isSelf}
                    />
                  ) : (
                    <MenuItem
                      icon={Shield}
                      label="Make admin"
                      onClick={() => {
                        setOpenMenu(null)
                        setPending({ kind: "promote", user: u })
                      }}
                    />
                  )}
                  <MenuItem
                    icon={u.status === "suspended" ? CircleCheck : UserCog}
                    label={u.status === "suspended" ? "Reactivate" : "Suspend"}
                    onClick={() => suspendToggle(u)}
                    disabled={isSelf}
                  />
                  {u.status === "banned" ? (
                    <MenuItem
                      icon={CircleCheck}
                      label="Unban"
                      onClick={() => {
                        setOpenMenu(null)
                        setPending({ kind: "unban", user: u })
                      }}
                    />
                  ) : (
                    <MenuItem
                      icon={Ban}
                      label="Ban user"
                      destructive
                      onClick={() => {
                        setOpenMenu(null)
                        setPending({ kind: "ban", user: u })
                      }}
                      disabled={isSelf}
                    />
                  )}
                  <div className="my-1 border-t border-border" />
                  <MenuItem
                    icon={Trash2}
                    label="Delete user"
                    destructive
                    onClick={() => {
                      setOpenMenu(null)
                      setPending({ kind: "delete", user: u })
                    }}
                    disabled={isSelf}
                  />
                </div>
              </>
            )}
          </div>
        )
      },
    },
  ]

  return (
    <div>
      <SectionHeader title="Users" description="Manage accounts, roles, and access." />

      {error && (
        <div className="mb-4">
          <ApiNotice message="The admin users endpoint (GET /api/admin/users) is not implemented yet. See ADMIN_API.md for the expected list shape and the role/status/delete mutations." />
        </div>
      )}

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
            placeholder="Search by username or email..."
            className="pl-8"
          />
        </div>
        <Select
          value={role}
          onChange={(e) => {
            setRole(e.target.value)
            setPage(1)
          }}
          aria-label="Filter by role"
          className="sm:w-36"
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r ? r[0].toUpperCase() + r.slice(1) : "All Roles"}
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
          className="sm:w-36"
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
        rowKey={(u) => u.id}
        loading={isLoading}
        emptyMessage="No users found."
        emptyIcon={Users}
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
        open={!!pending}
        onClose={() => setPending(null)}
        onConfirm={runAction}
        title={pendingTitle(pending)}
        message={pendingMessage(pending)}
        confirmLabel={pendingConfirmLabel(pending)}
        destructive={pending?.kind === "delete" || pending?.kind === "ban"}
        loading={working}
      />
    </div>
  )
}

function MenuItem({
  icon: Icon,
  label,
  onClick,
  destructive,
  disabled,
}: {
  icon: typeof Shield
  label: string
  onClick: () => void
  destructive?: boolean
  disabled?: boolean
}) {
  return (
    <button
      role="menuitem"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed",
        destructive
          ? "text-muted-foreground hover:text-destructive hover:bg-card"
          : "text-muted-foreground hover:text-foreground hover:bg-card"
      )}
    >
      <Icon className="size-3.5" />
      {label}
    </button>
  )
}

function pendingTitle(p: PendingAction): string {
  switch (p?.kind) {
    case "delete":
      return "Delete user"
    case "ban":
      return "Ban user"
    case "unban":
      return "Unban user"
    case "promote":
      return "Grant admin access"
    case "demote":
      return "Remove admin access"
    default:
      return ""
  }
}

function pendingMessage(p: PendingAction): string {
  switch (p?.kind) {
    case "delete":
      return `Permanently delete ${p.user.username}? Their bookmarks and reading progress will be removed. This cannot be undone.`
    case "ban":
      return `Ban ${p.user.username}? They will be unable to sign in until unbanned.`
    case "unban":
      return `Reactivate ${p.user.username}'s account?`
    case "promote":
      return `Give ${p.user.username} full administrator access to this portal?`
    case "demote":
      return `Remove administrator access from ${p.user.username}?`
    default:
      return ""
  }
}

function pendingConfirmLabel(p: PendingAction): string {
  switch (p?.kind) {
    case "delete":
      return "Delete"
    case "ban":
      return "Ban"
    case "unban":
      return "Unban"
    case "promote":
      return "Make admin"
    case "demote":
      return "Remove admin"
    default:
      return "Confirm"
  }
}
