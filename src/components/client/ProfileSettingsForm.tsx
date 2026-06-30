"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

export function ProfileSettingsForm({
  email,
  displayName,
  companyName,
  role,
}: {
  email: string
  displayName?: string | null
  companyName?: string | null
  role?: string | null
}) {
  const router = useRouter()
  const [name, setName] = useState(displayName ?? "")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [saving, setSaving] = useState(false)

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError("")
    setSuccess("")
    const res = await fetch("/api/client/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ display_name: name }),
    })
    const payload = await res.json().catch(() => null)
    if (!res.ok) {
      setError(payload?.error?.message ?? payload?.error?.code ?? "Unable to save profile")
      setSaving(false)
      return
    }
    setSuccess("Profile updated.")
    setSaving(false)
    router.refresh()
  }

  return (
    <form onSubmit={save} className="space-y-5 rounded-2xl border border-zinc-800 bg-zinc-950/40 p-6">
      <div>
        <h3 className="text-sm font-semibold text-white">Profile settings</h3>
        <p className="mt-1 text-xs text-zinc-500">Only display name is editable in D4.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm text-zinc-300">
          <span>Email</span>
          <input value={email} disabled className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-500" />
        </label>
        <label className="space-y-2 text-sm text-zinc-300">
          <span>Role</span>
          <input value={role ?? "unknown"} disabled className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-500" />
        </label>
      </div>
      <label className="space-y-2 text-sm text-zinc-300">
        <span>Tenant</span>
        <input value={companyName ?? "Unknown tenant"} disabled className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-500" />
      </label>
      <label className="space-y-2 text-sm text-zinc-300">
        <span>Display name</span>
        <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white" />
      </label>
      {error && <p className="text-sm text-red-400">{error}</p>}
      {success && <p className="text-sm text-emerald-400">{success}</p>}
      <button disabled={saving} className="rounded-full bg-gradient-to-r from-[#EE2A7B] to-[#7F3F98] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
        {saving ? "Saving..." : "Save display name"}
      </button>
    </form>
  )
}
