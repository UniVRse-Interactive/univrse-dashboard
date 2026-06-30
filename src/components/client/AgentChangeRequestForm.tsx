"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

const CHANGE_TYPES = ["agent_name", "persona", "greeting", "language", "helpdesk", "other"] as const

export function AgentChangeRequestForm() {
  const router = useRouter()
  const [changeType, setChangeType] = useState<(typeof CHANGE_TYPES)[number]>("agent_name")
  const [oldValue, setOldValue] = useState("")
  const [newValue, setNewValue] = useState("")
  const [notes, setNotes] = useState("")
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError("")
    setSuccess("")
    const res = await fetch("/api/client/change-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ change_type: changeType, old_value: oldValue, new_value: newValue, notes }),
    })
    const payload = await res.json().catch(() => null)
    if (!res.ok) {
      setError(payload?.error?.message ?? payload?.error?.code ?? "Request failed")
      setSaving(false)
      return
    }
    setOldValue("")
    setNewValue("")
    setNotes("")
    setSuccess("Change request submitted for owner/admin review.")
    setSaving(false)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-950/40 p-5">
      <div>
        <h3 className="text-sm font-semibold text-white">Request Change</h3>
        <p className="mt-1 text-xs text-zinc-500">PICs can request changes, but cannot write agent config directly.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm text-zinc-300">
          <span>Change type</span>
          <select value={changeType} onChange={(e) => setChangeType(e.target.value as (typeof CHANGE_TYPES)[number])} className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white">
            {CHANGE_TYPES.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </label>
        <label className="space-y-2 text-sm text-zinc-300">
          <span>Current value</span>
          <input value={oldValue} onChange={(e) => setOldValue(e.target.value)} className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white" />
        </label>
      </div>
      <label className="space-y-2 text-sm text-zinc-300">
        <span>Requested new value</span>
        <textarea value={newValue} onChange={(e) => setNewValue(e.target.value)} required className="min-h-[100px] w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white" />
      </label>
      <label className="space-y-2 text-sm text-zinc-300">
        <span>Notes</span>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="min-h-[80px] w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white" />
      </label>
      {error && <p className="text-sm text-red-400">{error}</p>}
      {success && <p className="text-sm text-emerald-400">{success}</p>}
      <button disabled={saving} className="rounded-full bg-gradient-to-r from-[#EE2A7B] to-[#7F3F98] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
        {saving ? "Submitting..." : "Submit change request"}
      </button>
    </form>
  )
}
