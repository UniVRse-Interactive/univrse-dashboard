"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

interface SupportRequest {
  id: string
  subject: string
  message: string
  contact_phone?: string | null
  status: string
  created_at: string
}

export function SupportRequestPanel({ items }: { items: SupportRequest[] }) {
  const router = useRouter()
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [contactPhone, setContactPhone] = useState("")
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError("")
    const res = await fetch("/api/client/support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, message, contact_phone: contactPhone || undefined }),
    })
    const payload = await res.json().catch(() => null)
    if (!res.ok) {
      setError(payload?.error?.message ?? payload?.error?.code ?? "Unable to submit support request")
      setSaving(false)
      return
    }
    setSubject("")
    setMessage("")
    setContactPhone("")
    setSaving(false)
    router.refresh()
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
      <form onSubmit={submit} className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-950/40 p-5">
        <div>
          <h3 className="text-sm font-semibold text-white">Open a support request</h3>
          <p className="mt-1 text-xs text-zinc-500">Stored locally in the dashboard DB only. No n8n forwarding in D4.</p>
        </div>
        <input value={subject} onChange={(e) => setSubject(e.target.value)} required placeholder="Subject" className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white" />
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} required placeholder="Describe the issue" className="min-h-[160px] w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white" />
        <input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="Optional contact phone" className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white" />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button disabled={saving} className="rounded-full bg-gradient-to-r from-[#EE2A7B] to-[#7F3F98] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
          {saving ? "Submitting..." : "Submit support request"}
        </button>
      </form>
      <div className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-950/30 p-5">
        <h3 className="text-sm font-semibold text-white">Recent requests</h3>
        {items.map((item) => (
          <div key={item.id} className="rounded-xl border border-zinc-800 p-4">
            <div className="flex items-center justify-between gap-4">
              <p className="font-medium text-white">{item.subject}</p>
              <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300">{item.status}</span>
            </div>
            <p className="mt-2 text-sm text-zinc-400">{item.message}</p>
            <p className="mt-2 text-xs text-zinc-500">{new Date(item.created_at).toLocaleString()}</p>
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-zinc-500">No support requests yet.</p>}
      </div>
    </div>
  )
}
