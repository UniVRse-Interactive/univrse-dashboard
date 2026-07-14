"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase"

interface Props {
  email: string
  displayName?: string | null
  companyName?: string | null
  role?: string | null
  phoneNumber?: string | null
}

function humanRole(role: string | null | undefined): string {
  switch (role) {
    case "tenant_pic":
    case "pic":
      return "Tenant PIC"
    case "tenant_owner":
      return "Tenant Owner"
    case "univrse_admin":
      return "UniVRse Admin"
    default:
      return role ? role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "Unknown"
  }
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs text-zinc-500">{label}</p>
      <div className="relative">
        <input
          value={value}
          disabled
          className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 pr-8 text-sm text-zinc-500"
        />
        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-700 text-xs select-none pointer-events-none">
          🔒
        </span>
      </div>
    </div>
  )
}

function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  description: string
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-zinc-800 last:border-0">
      <div className="min-w-0">
        <p className="text-sm text-white">{label}</p>
        <p className="text-xs text-zinc-500 mt-0.5">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative shrink-0 w-10 h-5 rounded-full transition-colors ${
          checked ? "bg-gradient-to-r from-[#EE2A7B] to-[#7F3F98]" : "bg-zinc-700"
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  )
}

export function ProfileSettingsForm({
  email,
  displayName,
  companyName,
  role,
  phoneNumber,
}: Props) {
  const router = useRouter()

  // ── Profile ─────────────────────────────────────────────────────────────────
  const [name, setName] = useState(displayName ?? "")
  const [phone, setPhone] = useState(phoneNumber ?? "")
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileError, setProfileError] = useState("")
  const [profileSuccess, setProfileSuccess] = useState("")
  const profileDirty =
    name !== (displayName ?? "") || phone !== (phoneNumber ?? "")

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    setProfileSaving(true)
    setProfileError("")
    setProfileSuccess("")
    const body: Record<string, string> = {}
    if (name !== (displayName ?? "")) body.display_name = name
    if (phone !== (phoneNumber ?? "")) body.phone_number = phone
    const res = await fetch("/api/client/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    const payload = await res.json().catch(() => null)
    if (!res.ok) {
      setProfileError(payload?.error?.message ?? "Unable to save profile")
      setProfileSaving(false)
      return
    }
    setProfileSuccess("Profile updated.")
    setProfileSaving(false)
    router.refresh()
  }

  // ── Security ────────────────────────────────────────────────────────────────
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordError, setPasswordError] = useState("")
  const [passwordSuccess, setPasswordSuccess] = useState("")
  const [sessionLoading, setSessionLoading] = useState(false)
  const [sessionError, setSessionError] = useState("")
  const [sessionSuccess, setSessionSuccess] = useState("")

  async function sendPasswordReset() {
    setPasswordLoading(true)
    setPasswordError("")
    setPasswordSuccess("")
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })
      if (error) setPasswordError(error.message)
      else setPasswordSuccess(`Reset email sent to ${email}. Check your inbox.`)
    } catch {
      setPasswordError("Unable to send reset email. Please try again.")
    }
    setPasswordLoading(false)
  }

  async function signOutOthers() {
    setSessionLoading(true)
    setSessionError("")
    setSessionSuccess("")
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signOut({ scope: "others" })
      if (error) setSessionError(error.message)
      else setSessionSuccess("All other sessions have been signed out.")
    } catch {
      setSessionError("Unable to sign out other sessions. Please try again.")
    }
    setSessionLoading(false)
  }

  // ── Notifications ───────────────────────────────────────────────────────────
  const [notifTickets, setNotifTickets] = useState(true)
  const [notifQuota, setNotifQuota] = useState(true)
  const [notifBilling, setNotifBilling] = useState(true)
  const [notifUpdates, setNotifUpdates] = useState(false)
  const [notifSaved, setNotifSaved] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem("univrse_notif_prefs")
      if (stored) {
        const prefs = JSON.parse(stored) as Record<string, boolean>
        if (prefs.tickets !== undefined) setNotifTickets(prefs.tickets)
        if (prefs.quota !== undefined) setNotifQuota(prefs.quota)
        if (prefs.billing !== undefined) setNotifBilling(prefs.billing)
        if (prefs.updates !== undefined) setNotifUpdates(prefs.updates)
      }
    } catch {}
  }, [])

  function saveNotifPrefs() {
    try {
      localStorage.setItem(
        "univrse_notif_prefs",
        JSON.stringify({
          tickets: notifTickets,
          quota: notifQuota,
          billing: notifBilling,
          updates: notifUpdates,
        })
      )
      setNotifSaved(true)
      setTimeout(() => setNotifSaved(false), 2500)
    } catch {}
  }

  // ── Danger Zone ─────────────────────────────────────────────────────────────
  const [exportLoading, setExportLoading] = useState(false)
  const [exportDone, setExportDone] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteDone, setDeleteDone] = useState(false)
  const [dangerError, setDangerError] = useState("")

  async function requestDataExport() {
    setExportLoading(true)
    setDangerError("")
    const res = await fetch("/api/client/support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject: "Data Export Request",
        message:
          "I would like to request a full export of my account data as per my rights under applicable data protection law.",
        category: "other",
        priority: "normal",
      }),
    })
    if (!res.ok) setDangerError("Unable to submit request. Please email support@univrse.io.")
    else setExportDone(true)
    setExportLoading(false)
  }

  async function requestAccountDeletion() {
    setDeleteLoading(true)
    setDangerError("")
    const res = await fetch("/api/client/support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject: "Account Deletion Request",
        message:
          "I would like to permanently delete my account and all associated data from the UniVRse platform.",
        category: "other",
        priority: "high",
      }),
    })
    if (!res.ok) {
      setDangerError("Unable to submit request. Please email support@univrse.io.")
    } else {
      setDeleteDone(true)
      setDeleteConfirm(false)
    }
    setDeleteLoading(false)
  }

  return (
    <div className="space-y-6">
      {/* 1 ── Profile */}
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={saveProfile} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <p className="text-xs text-zinc-500">Display name</p>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white"
                />
              </div>
              <ReadOnlyField label="Email" value={email} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <p className="text-xs text-zinc-500">Phone</p>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +601234567890"
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white"
                />
              </div>
              <ReadOnlyField label="Role" value={humanRole(role)} />
            </div>
            <ReadOnlyField label="Tenant" value={companyName ?? "—"} />
            {profileError && <p className="text-sm text-red-400">{profileError}</p>}
            {profileSuccess && <p className="text-sm text-emerald-400">{profileSuccess}</p>}
            <button
              type="submit"
              disabled={profileSaving || !profileDirty}
              className="rounded-full bg-gradient-to-r from-[#EE2A7B] to-[#7F3F98] px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
            >
              {profileSaving ? "Saving..." : "Save changes"}
            </button>
          </form>
        </CardContent>
      </Card>

      {/* 2 ── Security */}
      <Card>
        <CardHeader>
          <CardTitle>Security</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-3">
            <p className="text-sm text-zinc-400">
              Receive a secure link to reset your password by email.
            </p>
            {passwordError && <p className="text-sm text-red-400">{passwordError}</p>}
            {passwordSuccess && <p className="text-sm text-emerald-400">{passwordSuccess}</p>}
            <button
              type="button"
              onClick={sendPasswordReset}
              disabled={passwordLoading || !!passwordSuccess}
              className="rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:border-zinc-500 hover:text-white transition-colors disabled:opacity-40"
            >
              {passwordLoading
                ? "Sending..."
                : passwordSuccess
                ? "Email sent ✓"
                : "Send password reset email"}
            </button>
          </div>

          <div className="border-t border-zinc-800 pt-5 space-y-3">
            <p className="text-sm font-medium text-white">Active sessions</p>
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/30 p-4 flex items-center gap-3">
              <span className="text-lg">🖥</span>
              <div className="min-w-0">
                <p className="text-sm text-white">Current session</p>
                <p className="text-xs text-zinc-500">This device · Active now</p>
              </div>
              <Badge variant="success" className="ml-auto shrink-0">
                Active
              </Badge>
            </div>
            <p className="text-xs text-zinc-600">
              Full session history is managed by UniVRse. Contact support for a session audit.
            </p>
            {sessionError && <p className="text-sm text-red-400">{sessionError}</p>}
            {sessionSuccess && <p className="text-sm text-emerald-400">{sessionSuccess}</p>}
            <button
              type="button"
              onClick={signOutOthers}
              disabled={sessionLoading || !!sessionSuccess}
              className="rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:border-zinc-500 hover:text-white transition-colors disabled:opacity-40"
            >
              {sessionLoading
                ? "Signing out..."
                : sessionSuccess
                ? "Done ✓"
                : "Sign out all other sessions"}
            </button>
          </div>
        </CardContent>
      </Card>

      {/* 3 ── Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-zinc-600">
            ⓘ Notification preferences are stored locally and may reset when you sign out. Backend
            sync coming soon.
          </p>
          <div className="rounded-xl border border-zinc-800 divide-y divide-zinc-800 px-4">
            <Toggle
              checked={notifTickets}
              onChange={setNotifTickets}
              label="Ticket replies"
              description="When UniVRse responds to your support request"
            />
            <Toggle
              checked={notifQuota}
              onChange={setNotifQuota}
              label="Quota warnings"
              description="At 70%, 90%, and 100% of your monthly limit"
            />
            <Toggle
              checked={notifBilling}
              onChange={setNotifBilling}
              label="Billing alerts"
              description="Invoice issued, trial expiry, payment due"
            />
            <Toggle
              checked={notifUpdates}
              onChange={setNotifUpdates}
              label="Product updates"
              description="New features, tips, and platform announcements"
            />
          </div>
          <button
            type="button"
            onClick={saveNotifPrefs}
            className="rounded-full bg-gradient-to-r from-[#EE2A7B] to-[#7F3F98] px-4 py-2 text-sm font-semibold text-white"
          >
            {notifSaved ? "Preferences saved ✓" : "Save preferences"}
          </button>
        </CardContent>
      </Card>

      {/* 4 ── Appearance */}
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <p className="text-xs text-zinc-500">Language</p>
              <select
                defaultValue="en"
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white"
              >
                <option value="en">English</option>
              </select>
            </div>
            <ReadOnlyField label="Theme" value="Dark" />
          </div>
          <p className="text-xs text-zinc-600">
            ⓘ Bahasa Melayu and additional themes coming soon.
          </p>
        </CardContent>
      </Card>

      {/* 5 ── Danger Zone */}
      <div className="rounded-2xl border border-amber-900/40 bg-amber-950/10">
        <div className="px-6 pt-5 pb-3">
          <p className="text-sm font-semibold text-amber-400">⚠ Danger Zone</p>
          <p className="text-xs text-zinc-500 mt-0.5">
            These actions are permanent or require review by the UniVRse team.
          </p>
        </div>
        <div className="space-y-3 p-4">
          {/* Data export */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium text-white">Request data export</p>
              <p className="text-xs text-zinc-500 mt-0.5">
                Download a copy of your account data. Reviewed within 48 hours.
              </p>
              {exportDone && (
                <p className="text-xs text-emerald-400 mt-1.5">
                  Request submitted — we&apos;ll contact you within 48 hours.
                </p>
              )}
            </div>
            {!exportDone && (
              <button
                type="button"
                onClick={requestDataExport}
                disabled={exportLoading}
                className="shrink-0 rounded-full border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 hover:border-zinc-500 hover:text-white transition-colors disabled:opacity-40"
              >
                {exportLoading ? "Submitting..." : "Request →"}
              </button>
            )}
          </div>

          {/* Account deletion */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-white">Request account deletion</p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Permanently remove your account and all data. This cannot be undone.
                </p>
                {deleteDone && (
                  <p className="text-xs text-emerald-400 mt-1.5">
                    Request submitted — we&apos;ll contact you within 48 hours.
                  </p>
                )}
              </div>
              {!deleteDone && !deleteConfirm && (
                <button
                  type="button"
                  onClick={() => setDeleteConfirm(true)}
                  className="shrink-0 rounded-full border border-red-900 px-3 py-1.5 text-xs text-red-400 hover:border-red-700 hover:text-red-300 transition-colors"
                >
                  Request →
                </button>
              )}
            </div>
            {deleteConfirm && (
              <div className="rounded-xl border border-red-800 bg-red-950/30 p-4 space-y-3">
                <p className="text-sm font-medium text-red-300">Are you sure?</p>
                <p className="text-xs text-red-400">
                  This action is permanent. A deletion request will be submitted to the UniVRse
                  team and reviewed within 48 hours. Your account remains active until the review
                  is complete.
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={requestAccountDeletion}
                    disabled={deleteLoading}
                    className="rounded-full bg-red-600 hover:bg-red-500 px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-50 transition-colors"
                  >
                    {deleteLoading ? "Submitting..." : "Yes, request deletion"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteConfirm(false)}
                    className="rounded-full border border-zinc-700 px-4 py-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {dangerError && <p className="text-sm text-red-400 px-1">{dangerError}</p>}
          <p className="text-xs text-zinc-600 px-1">
            ⓘ Data export and deletion requests are reviewed by UniVRse within 48 hours. For
            urgent matters, contact support@univrse.io directly.
          </p>
        </div>
      </div>
    </div>
  )
}
