"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

interface NumberRow {
  id: string
  phone_number: string
  name?: string | null
  role: string
  authorized?: boolean | null
}

export function TeamNumbersManager({ numbers }: { numbers: NumberRow[] }) {
  const router = useRouter()
  const [phone, setPhone] = useState("")
  const [addName, setAddName] = useState("")
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editSaving, setEditSaving] = useState(false)

  async function addNumber(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError("")
    const res = await fetch("/api/client/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone_number: phone, name: addName }),
    })
    const payload = await res.json().catch(() => null)
    if (!res.ok) {
      setError(payload?.error?.message ?? payload?.error?.code ?? "Unable to add number")
      setSaving(false)
      return
    }
    setPhone("")
    setAddName("")
    setSaving(false)
    router.refresh()
  }

  function startEdit(row: NumberRow) {
    setEditId(row.id)
    setEditName(row.name ?? "")
    setError("")
  }

  function cancelEdit() {
    setEditId(null)
    setEditName("")
  }

  async function saveEdit(id: string) {
    setEditSaving(true)
    setError("")
    const res = await fetch(`/api/client/staff/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName }),
    })
    const payload = await res.json().catch(() => null)
    if (!res.ok) {
      setError(payload?.error?.message ?? payload?.error?.code ?? "Unable to save changes")
      setEditSaving(false)
      return
    }
    setEditId(null)
    setEditName("")
    setEditSaving(false)
    router.refresh()
  }

  async function removeNumber(id: string) {
    setError("")
    const res = await fetch(`/api/client/staff/${id}`, { method: "DELETE" })
    const payload = await res.json().catch(() => null)
    if (!res.ok) {
      setError(payload?.error?.message ?? payload?.error?.code ?? "Unable to remove number")
      return
    }
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <form onSubmit={addNumber} className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-5 space-y-3">
        <div className="flex flex-col gap-3 md:flex-row">
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone number (e.g. 60123456789)"
            className="flex-1 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white placeholder:text-zinc-600"
          />
          <input
            value={addName}
            onChange={(e) => setAddName(e.target.value)}
            placeholder="Name (optional)"
            className="flex-1 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white placeholder:text-zinc-600"
          />
          <button
            disabled={saving || !phone.trim()}
            className="rounded-full bg-gradient-to-r from-[#EE2A7B] to-[#7F3F98] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving ? "Adding..." : "Add staff number"}
          </button>
        </div>
      </form>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="space-y-3">
        {numbers.map((row) => (
          <div key={row.id} className="rounded-xl border border-zinc-800 bg-zinc-950/30 p-4">
            {editId === row.id ? (
              <div className="flex items-center gap-3">
                <div className="flex-1 space-y-1">
                  <p className="text-sm text-zinc-400">{row.phone_number}</p>
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Display name"
                    autoFocus
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-white placeholder:text-zinc-600"
                  />
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => saveEdit(row.id)}
                    disabled={editSaving}
                    className="rounded-full bg-gradient-to-r from-[#EE2A7B] to-[#7F3F98] px-3 py-1 text-xs font-semibold text-white disabled:opacity-50"
                  >
                    {editSaving ? "Saving…" : "Save"}
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-400 hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-white">{row.phone_number}</p>
                  <p className="text-xs text-zinc-500">
                    {row.name ?? <span className="italic">Unnamed</span>} · {row.role}
                    {row.role === "pic" && <span className="ml-1 text-[#EE2A7B]">· owner</span>}
                  </p>
                </div>
                {row.role !== "pic" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEdit(row)}
                      className="rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-300 hover:border-zinc-500 hover:text-white"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => removeNumber(row.id)}
                      className="rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-300 hover:border-red-500 hover:text-red-400"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        {numbers.length === 0 && <p className="text-sm text-zinc-500">No staff numbers configured yet.</p>}
      </div>
    </div>
  )
}
