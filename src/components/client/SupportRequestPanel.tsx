"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface SupportRequest {
  id: string
  subject: string
  message: string
  contact_phone?: string | null
  category?: string | null
  priority?: string | null
  status: string
  created_at: string
  resolved_at?: string | null
}

interface Props {
  items: SupportRequest[]
  whatsappNumber: string | null
  helpCenterUrl: string | null
}

const CATEGORY_OPTIONS = [
  { value: "general", label: "General question" },
  { value: "agent_not_responding", label: "Agent not responding" },
  { value: "whatsapp_issue", label: "WhatsApp issue" },
  { value: "dashboard_issue", label: "Dashboard issue" },
  { value: "billing_question", label: "Billing question" },
  { value: "other", label: "Other" },
]

const PRIORITY_OPTIONS = [
  { value: "urgent", label: "Urgent (agent is down)" },
  { value: "high", label: "High (blocking work)" },
  { value: "normal", label: "Normal" },
  { value: "low", label: "Low (nice to have)" },
]

function priorityDot(priority: string | null | undefined): string {
  switch (priority) {
    case "urgent": return "🔴"
    case "high": return "🟡"
    case "low": return "⚪"
    default: return "🟢"
  }
}

function priorityLabel(priority: string | null | undefined): string {
  return PRIORITY_OPTIONS.find((p) => p.value === priority)?.label ?? "Normal"
}

function statusBadgeVariant(
  status: string
): "success" | "warning" | "secondary" | "destructive" {
  if (status === "resolved" || status === "closed") return "success"
  if (status === "in_progress") return "warning"
  return "secondary"
}

function statusLabel(status: string): string {
  if (status === "in_progress") return "In Progress"
  return status.charAt(0).toUpperCase() + status.slice(1)
}

function categoryLabel(category: string | null | undefined): string {
  return CATEGORY_OPTIONS.find((c) => c.value === category)?.label ?? (category ?? "General question")
}

type FilterTab = "all" | "open" | "resolved"

export function SupportRequestPanel({ items, whatsappNumber, helpCenterUrl }: Props) {
  const router = useRouter()
  const [category, setCategory] = useState("general")
  const [priority, setPriority] = useState("normal")
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [contactPhone, setContactPhone] = useState("")
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState<FilterTab>("all")
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const waHref = whatsappNumber
    ? `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, "")}`
    : null

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError("")
    const res = await fetch("/api/client/support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject,
        message,
        category,
        priority,
        contact_phone: contactPhone || undefined,
      }),
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
    setCategory("general")
    setPriority("normal")
    setSaving(false)
    router.refresh()
  }

  const filteredItems = items.filter((item) => {
    if (filter === "open") return item.status === "open" || item.status === "in_progress"
    if (filter === "resolved") return item.status === "resolved" || item.status === "closed"
    return true
  })

  return (
    <div className="space-y-6">
      {/* Contact channels */}
      <Card>
        <CardHeader>
          <CardTitle>Need help? We&apos;re here.</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row">
            {waHref && (
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 rounded-xl border border-zinc-800 bg-zinc-950/30 p-4 hover:border-zinc-600 transition-colors group"
              >
                <p className="text-sm font-semibold text-white">💬 WhatsApp</p>
                <p className="mt-1 text-sm text-zinc-300 font-mono">{whatsappNumber}</p>
                <p className="mt-1.5 text-xs text-zinc-500 group-hover:text-zinc-400 transition-colors">Tap to open chat →</p>
              </a>
            )}
            <div className="flex-1 rounded-xl border border-zinc-800 bg-zinc-950/30 p-4">
              <p className="text-sm font-semibold text-white">📧 Email</p>
              <p className="mt-1 text-sm text-zinc-300">support@univrse.io</p>
              <p className="mt-1.5 text-xs text-zinc-500">We respond within 4 business hours</p>
            </div>
            {helpCenterUrl && (
              <a
                href={helpCenterUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 rounded-xl border border-zinc-800 bg-zinc-950/30 p-4 hover:border-zinc-600 transition-colors group"
              >
                <p className="text-sm font-semibold text-white">📖 Help Center</p>
                <p className="mt-1 text-xs text-zinc-500 group-hover:text-zinc-400 transition-colors">Browse guides and FAQs →</p>
              </a>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
        {/* Ticket form */}
        <Card>
          <CardHeader>
            <CardTitle>Open a support request</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="text-xs text-zinc-500 mb-1.5 block">What kind of issue?</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white"
                >
                  {CATEGORY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-zinc-500 mb-1.5 block">How urgent is this?</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white"
                >
                  {PRIORITY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                placeholder="Subject"
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white"
              />
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                placeholder="Describe the issue in detail"
                className="min-h-[140px] w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white"
              />
              <input
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="Optional: your contact phone number"
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white"
              />
              {error && <p className="text-sm text-red-400">{error}</p>}
              <button
                disabled={saving}
                className="rounded-full bg-gradient-to-r from-[#EE2A7B] to-[#7F3F98] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {saving ? "Submitting..." : "Submit support request"}
              </button>
              <p className="text-xs text-zinc-600">
                ⓘ We typically respond within 4 business hours. Urgent tickets are prioritised.
              </p>
            </form>
          </CardContent>
        </Card>

        {/* Ticket history */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <CardTitle>Your tickets</CardTitle>
              <div className="flex gap-1">
                {(["all", "open", "resolved"] as FilterTab[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setFilter(tab)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      filter === tab
                        ? "bg-zinc-700 text-white"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {filteredItems.length === 0 && (
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/30 p-6 text-center space-y-1">
                <p className="text-sm text-zinc-400">
                  {filter === "all" ? "No tickets yet" : `No ${filter} tickets`}
                </p>
                {filter === "all" && (
                  <p className="text-xs text-zinc-600">
                    Submit your first support request using the form.
                  </p>
                )}
              </div>
            )}
            {filteredItems.map((item) => {
              const isExpanded = expandedId === item.id
              return (
                <div
                  key={item.id}
                  className="rounded-xl border border-zinc-800 bg-zinc-950/30 p-4 space-y-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="text-base leading-none shrink-0"
                        title={priorityLabel(item.priority)}
                      >
                        {priorityDot(item.priority)}
                      </span>
                      <p className="font-medium text-white text-sm truncate">{item.subject}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={statusBadgeVariant(item.status)}>
                        {statusLabel(item.status)}
                      </Badge>
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : item.id)}
                        className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors whitespace-nowrap"
                      >
                        {isExpanded ? "Close" : "View →"}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-zinc-600 flex-wrap">
                    <span>{categoryLabel(item.category)}</span>
                    <span>·</span>
                    <span>
                      {new Date(item.created_at).toLocaleString("en-MY", {
                        timeZone: "Asia/Kuala_Lumpur",
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  {isExpanded && (
                    <div className="pt-3 border-t border-zinc-800 space-y-2">
                      <p className="text-sm text-zinc-300 whitespace-pre-wrap">{item.message}</p>
                      {item.contact_phone && (
                        <p className="text-xs text-zinc-500">Contact: {item.contact_phone}</p>
                      )}
                      {item.resolved_at && (
                        <p className="text-xs text-zinc-500">
                          Resolved:{" "}
                          {new Date(item.resolved_at).toLocaleString("en-MY", {
                            timeZone: "Asia/Kuala_Lumpur",
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
