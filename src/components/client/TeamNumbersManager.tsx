"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

const MEMBER_QUOTA_CAP = 300

interface NumberRow {
  id: string
  phone_number: string
  name?: string | null
  role: string
  authorized?: boolean | null
}

interface TeamSummary {
  seat_total: number
  seat_used: number
  package_label: string | null
  company_quota: number
  company_used: number
  billing_period: string
  member_usage: Record<string, number>
}

function formatBillingPeriod(period: string | null | undefined): string | null {
  if (!period) return null
  const [year, month] = period.split("-")
  if (!year || !month) return period
  const date = new Date(Number(year), Number(month) - 1, 1)
  return date.toLocaleDateString("en-MY", { month: "long", year: "numeric" })
}

function Tip({ text, children }: { text: string; children: React.ReactNode }) {
  return (
    <span className="relative group/tip inline-flex items-center">
      {children}
      <span className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 max-w-[200px] text-center whitespace-normal rounded-lg bg-zinc-800 border border-zinc-700 px-2.5 py-1.5 text-xs text-zinc-300 invisible group-hover/tip:visible z-20 pointer-events-none shadow-lg">
        {text}
      </span>
    </span>
  )
}

function quotaBarColor(pct: number): string {
  if (pct >= 90) return "bg-red-500"
  if (pct >= 70) return "bg-amber-500"
  return "bg-gradient-to-r from-[#EE2A7B] to-[#7F3F98]"
}

export function TeamNumbersManager({ numbers, summary }: { numbers: NumberRow[]; summary: TeamSummary | null }) {
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

  const memberUsage = summary?.member_usage ?? {}
  const companyQuota = summary?.company_quota ?? 0
  const companyUsed = summary?.company_used ?? 0
  const companyPct = companyQuota > 0 ? Math.min(100, Math.round((companyUsed / companyQuota) * 100)) : 0
  const seatTotal = summary?.seat_total ?? 0
  const seatUsed = summary?.seat_used ?? 0
  const seatPct = seatTotal > 0 ? Math.min(100, Math.round((seatUsed / seatTotal) * 100)) : 0

  const knownPhones = new Set(numbers.map((n) => n.phone_number))
  const otherUsage = Object.entries(memberUsage)
    .filter(([p]) => !knownPhones.has(p))
    .reduce((sum, [, count]) => sum + count, 0)

  return (
    <div className="space-y-6">
      {/* Seat counter */}
      {summary && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-semibold text-white">👥 Team seats</p>
              {summary.package_label && (
                <p className="text-xs text-zinc-500 mt-0.5">{summary.package_label}</p>
              )}
            </div>
            <p className="text-sm text-zinc-300">{seatUsed} of {seatTotal} used</p>
          </div>
          <div className="h-2 rounded-full bg-zinc-800">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-[#EE2A7B] to-[#7F3F98] transition-all"
              style={{ width: `${seatPct}%` }}
            />
          </div>
          <p className="mt-1.5 text-xs text-zinc-600">{seatPct}% of {seatTotal} seats</p>
        </div>
      )}

      {/* Add staff form */}
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

      {/* Member cards */}
      <div className="space-y-3">
        {numbers.map((row) => {
          const isPic = row.role === "pic"
          const used = memberUsage[row.phone_number] ?? 0
          const cap = isPic ? companyQuota : MEMBER_QUOTA_CAP
          const pct = cap > 0 ? Math.min(100, Math.round((used / cap) * 100)) : 0

          return (
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
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-white">{row.phone_number}</p>
                      <p className="text-xs text-zinc-500">
                        {row.name ?? <span className="italic">Unnamed</span>} · {row.role}
                        {isPic && <span className="ml-1 text-[#EE2A7B]">· owner</span>}
                      </p>
                    </div>
                    {!isPic && (
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

                  {/* Capability badges */}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <Tip text="Can chat with Hani via WhatsApp">
                      <span className="inline-flex items-center gap-1 rounded-full bg-zinc-800 border border-zinc-700 px-2 py-0.5 text-xs text-zinc-300 cursor-default">
                        💬 WhatsApp
                      </span>
                    </Tip>
                    {isPic ? (
                      <Tip text="Can chat with Hani via Telegram">
                        <span className="inline-flex items-center gap-1 rounded-full bg-zinc-800 border border-zinc-700 px-2 py-0.5 text-xs text-zinc-300 cursor-default">
                          📨 Telegram
                        </span>
                      </Tip>
                    ) : (
                      <Tip text="Coming soon — Telegram access for members is not yet available">
                        <span className="inline-flex items-center gap-1 rounded-full bg-zinc-900 border border-zinc-800 px-2 py-0.5 text-xs text-zinc-600 cursor-default">
                          📨 Telegram
                        </span>
                      </Tip>
                    )}
                    <Tip text={isPic ? "Can access and manage company knowledge base" : "Can access company knowledge base (read-only)"}>
                      <span className="inline-flex items-center gap-1 rounded-full bg-zinc-800 border border-zinc-700 px-2 py-0.5 text-xs text-zinc-300 cursor-default">
                        📚 Knowledge Base
                      </span>
                    </Tip>
                  </div>

                  {/* Per-member quota bar */}
                  <div className="mt-3 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-500">Messages this month</span>
                      <span className="text-zinc-400">
                        {used}
                        {isPic
                          ? ` / ${companyQuota.toLocaleString()} (shared pool)`
                          : ` / ${MEMBER_QUOTA_CAP}`}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-zinc-800">
                      <div
                        className={`h-1.5 rounded-full transition-all ${quotaBarColor(pct)}`}
                        style={{ width: `${pct || 0}%` }}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          )
        })}
        {numbers.length === 0 && <p className="text-sm text-zinc-500">No staff numbers configured yet.</p>}
      </div>

      {/* Company quota summary */}
      {summary && companyQuota > 0 && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-5 space-y-4">
          <div>
            <p className="text-sm font-semibold text-white">Company quota usage</p>
            {summary.billing_period && (
              <p className="text-xs text-zinc-500 mt-0.5">{formatBillingPeriod(summary.billing_period)}</p>
            )}
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1.5">
              <span className="text-zinc-300">{companyUsed.toLocaleString()} of {companyQuota.toLocaleString()} used</span>
              <span className="text-zinc-500">{companyPct}%</span>
            </div>
            <div className="h-2 rounded-full bg-zinc-800">
              <div
                className={`h-2 rounded-full transition-all ${quotaBarColor(companyPct)}`}
                style={{ width: `${companyPct || 0}%` }}
              />
            </div>
          </div>
          <div className="space-y-2 border-t border-zinc-800 pt-3">
            {numbers.map((n) => (
              <div key={n.id} className="flex justify-between text-xs">
                <span className="text-zinc-400">{n.name ?? n.phone_number}</span>
                <span className="text-zinc-500">{(memberUsage[n.phone_number] ?? 0).toLocaleString()} messages</span>
              </div>
            ))}
            {otherUsage > 0 && (
              <div className="flex justify-between text-xs">
                <span className="text-zinc-600">Other</span>
                <span className="text-zinc-600">{otherUsage.toLocaleString()} messages</span>
              </div>
            )}
            <div className="flex justify-between text-xs border-t border-zinc-800 pt-2 mt-1">
              <span className="text-zinc-500">Remaining pool</span>
              <span className="text-zinc-400">{Math.max(0, companyQuota - companyUsed).toLocaleString()} messages</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
