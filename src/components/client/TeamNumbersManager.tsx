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
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)

  async function addNumber(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError("")
    const res = await fetch("/api/client/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone_number: phone }),
    })
    const payload = await res.json().catch(() => null)
    if (!res.ok) {
      setError(payload?.error?.message ?? payload?.error?.code ?? "Unable to add number")
      setSaving(false)
      return
    }
    setPhone("")
    setSaving(false)
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
      <form onSubmit={addNumber} className="flex flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-950/40 p-5 md:flex-row">
        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="60123456789" className="flex-1 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white" />
        <button disabled={saving} className="rounded-full bg-gradient-to-r from-[#EE2A7B] to-[#7F3F98] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
          {saving ? "Adding..." : "Add staff number"}
        </button>
      </form>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <div className="space-y-3">
        {numbers.map((row) => (
          <div key={row.id} className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950/30 p-4">
            <div>
              <p className="font-medium text-white">{row.phone_number}</p>
              <p className="text-xs text-zinc-500">{row.name ?? "Unnamed"} · {row.role} · {row.authorized ? "authorized" : "disabled"}</p>
            </div>
            <button onClick={() => removeNumber(row.id)} className="rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-300 hover:border-red-500 hover:text-red-400">
              Disable
            </button>
          </div>
        ))}
        {numbers.length === 0 && <p className="text-sm text-zinc-500">No staff numbers configured yet.</p>}
      </div>
    </div>
  )
}
