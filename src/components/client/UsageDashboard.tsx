"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface MemberRow {
  phone_number: string
  name: string | null
  role: string
  used: number
  cap: number | null
  pct: number
}

interface LogRow {
  id: string
  query_at: string
  route?: string | null
  response_ms?: number | null
  was_successful?: boolean | null
  phone_number?: string | null
  sender_name?: string | null
}

interface FilterMember {
  phone_number: string
  name?: string | null
}

interface SummaryProps {
  billingPeriod: string | null
  companyUsed: number
  companyQuota: number
  packageLabel: string | null
}

interface Props {
  summary: SummaryProps
  memberRows: MemberRow[]
  otherUsage: number
  logs: LogRow[]
  members: FilterMember[]
}

function formatLatency(ms: number | null | undefined): string | null {
  if (ms === null || ms === undefined || ms === 0) return null
  if (ms < 1000) return `${ms} ms`
  return `${(ms / 1000).toFixed(1)} s`
}

function formatChannel(route: string | null | undefined): string {
  if (!route || route === "query") return "WhatsApp"
  if (route.toLowerCase().includes("telegram")) return "Telegram"
  return "WhatsApp"
}

function formatSender(senderName: string | null | undefined, phoneNumber: string | null | undefined): string {
  if (senderName) return senderName
  if (phoneNumber) return `…${phoneNumber.slice(-4)}`
  return "Unknown"
}

function quotaBarColor(pct: number): string {
  if (pct >= 90) return "bg-red-500"
  if (pct >= 70) return "bg-amber-500"
  return "bg-gradient-to-r from-[#EE2A7B] to-[#7F3F98]"
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
      <span className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 max-w-[180px] text-center whitespace-normal rounded-lg bg-zinc-800 border border-zinc-700 px-2.5 py-1.5 text-xs text-zinc-300 invisible group-hover/tip:visible z-20 pointer-events-none shadow-lg">
        {text}
      </span>
    </span>
  )
}

function exportMemberCSV(memberRows: MemberRow[], otherUsage: number) {
  const header = "Name,Messages Used,Cap,Percentage,Status"
  const rows = memberRows.map((m) => {
    const cap = m.cap === null ? "Shared" : String(m.cap)
    const pct = m.cap === null ? "—" : `${m.pct}%`
    return `"${m.name ?? m.phone_number}",${m.used},${cap},${pct},Active`
  })
  if (otherUsage > 0) rows.push(`Others,${otherUsage},—,—,—`)
  const csv = [header, ...rows].join("\n")
  const blob = new Blob([csv], { type: "text/csv" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = "usage-breakdown.csv"
  a.click()
  URL.revokeObjectURL(url)
}

export function UsageDashboard({ summary, memberRows, otherUsage, logs, members }: Props) {
  const [selectedPhone, setSelectedPhone] = useState("all")

  const { billingPeriod, companyUsed, companyQuota, packageLabel } = summary
  const remaining = Math.max(0, companyQuota - companyUsed)
  const companyPct = companyQuota > 0 ? Math.min(100, Math.round((companyUsed / companyQuota) * 100)) : 0
  const periodLabel = formatBillingPeriod(billingPeriod) ?? billingPeriod ?? "Current period"

  const filteredLogs = selectedPhone === "all"
    ? logs
    : logs.filter((l) => l.phone_number === selectedPhone)

  return (
    <div className="space-y-6">
      {/* Compact summary bar */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-5">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between text-sm">
          <span className="font-semibold text-white">
            {periodLabel}
            {packageLabel && <span className="ml-2 text-xs font-normal text-zinc-500">· {packageLabel}</span>}
          </span>
          <span className="text-zinc-300">{companyUsed} of {companyQuota} used ({companyPct}%)</span>
          <span className="text-zinc-500">{remaining.toLocaleString()} remaining in pool</span>
        </div>
        <div className="mt-3 h-2 rounded-full bg-zinc-800">
          <div
            className={`h-2 rounded-full transition-all ${quotaBarColor(companyPct)}`}
            style={{ width: `${companyPct || 0}%` }}
          />
        </div>
      </div>

      {/* Per-member usage breakdown */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Usage by team member</CardTitle>
            <button
              onClick={() => exportMemberCSV(memberRows, otherUsage)}
              className="rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-400 hover:border-zinc-500 hover:text-white transition-colors"
            >
              Export CSV
            </button>
          </div>
        </CardHeader>
        <CardContent className="space-y-0">
          {/* Column headers */}
          <div className="hidden md:grid md:grid-cols-[2fr_60px_80px_2fr_80px] gap-x-4 pb-2 px-1 text-xs uppercase tracking-wide text-zinc-600">
            <span>Name</span>
            <span>Used</span>
            <span>Cap</span>
            <span>Usage</span>
            <span>Status</span>
          </div>

          {memberRows.map((m) => (
            <div
              key={m.phone_number}
              className="grid grid-cols-2 md:grid-cols-[2fr_60px_80px_2fr_80px] gap-x-4 gap-y-1 items-center py-3 border-t border-zinc-800 px-1 first:border-t-0"
            >
              <p className="text-sm font-medium text-white col-span-2 md:col-span-1">
                {m.name ?? m.phone_number}
                {m.role === "pic" && <span className="ml-1.5 text-xs text-[#EE2A7B]">owner</span>}
              </p>
              <p className="text-sm text-zinc-300">{m.used}</p>
              <p className="text-sm text-zinc-500">{m.cap === null ? "Shared" : m.cap}</p>
              <div className="col-span-2 md:col-span-1 space-y-0.5">
                <div className="h-1.5 rounded-full bg-zinc-800">
                  <div
                    className={`h-1.5 rounded-full transition-all ${m.cap === null ? "bg-gradient-to-r from-[#EE2A7B] to-[#7F3F98]" : quotaBarColor(m.pct)}`}
                    style={{ width: m.cap === null ? `${Math.min(100, Math.round((m.used / companyQuota) * 100)) || 0}%` : `${m.pct || 0}%` }}
                  />
                </div>
                <p className="text-xs text-zinc-600">
                  {m.cap === null
                    ? `${m.used} / ${companyQuota} (shared pool)`
                    : `${m.used} / ${m.cap} — ${m.pct}%`}
                </p>
              </div>
              <span className="text-xs text-emerald-500">● Active</span>
            </div>
          ))}

          {otherUsage > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-[2fr_60px_80px_2fr_80px] gap-x-4 items-center py-3 border-t border-zinc-800 px-1">
              <p className="text-sm text-zinc-500 col-span-2 md:col-span-1">Others</p>
              <p className="text-sm text-zinc-500">{otherUsage}</p>
              <p className="text-sm text-zinc-600">—</p>
              <p className="text-xs text-zinc-600 col-span-2 md:col-span-1">System or unregistered numbers</p>
              <span className="text-xs text-zinc-600">—</span>
            </div>
          )}

          <div className="border-t border-zinc-800 pt-3 mt-1 flex justify-between text-xs px-1">
            <span className="text-zinc-500">Pool total: {companyUsed} of {companyQuota} used</span>
            <span className="text-zinc-400">{remaining.toLocaleString()} remaining</span>
          </div>
        </CardContent>
      </Card>

      {/* Query log */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <CardTitle>Recent queries</CardTitle>
            <select
              value={selectedPhone}
              onChange={(e) => setSelectedPhone(e.target.value)}
              className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-white"
            >
              <option value="all">All members</option>
              {members.map((m) => (
                <option key={m.phone_number} value={m.phone_number}>
                  {m.name ?? `…${m.phone_number.slice(-4)}`}
                </option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent className="space-y-0">
          {/* Column headers */}
          <div className="hidden md:grid md:grid-cols-[1.6fr_1fr_90px_80px_44px] gap-x-4 pb-2 px-1 text-xs uppercase tracking-wide text-zinc-600">
            <span>Time</span>
            <span>Sender</span>
            <span>Channel</span>
            <span>Latency</span>
            <span>Result</span>
          </div>

          {filteredLogs.map((row) => {
            const latency = formatLatency(row.response_ms)
            return (
              <div
                key={row.id}
                className="grid grid-cols-2 md:grid-cols-[1.6fr_1fr_90px_80px_44px] gap-x-4 gap-y-1 items-center py-3 border-t border-zinc-800 px-1 first:border-t-0"
              >
                <p className="text-sm text-zinc-400">
                  {new Date(row.query_at).toLocaleString("en-MY", {
                    timeZone: "Asia/Kuala_Lumpur",
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                <p className="text-sm font-medium text-white">
                  {formatSender(row.sender_name, row.phone_number)}
                </p>
                <p className="text-sm text-zinc-300">{formatChannel(row.route)}</p>
                <div className="text-sm">
                  {latency ? (
                    <span className="text-zinc-300">{latency}</span>
                  ) : (
                    <Tip text="Latency tracking coming soon">
                      <span className="text-zinc-600 cursor-default">—</span>
                    </Tip>
                  )}
                </div>
                <p className={`text-sm font-medium ${row.was_successful !== false ? "text-green-500" : "text-red-400"}`}>
                  {row.was_successful !== false ? "✓" : "✗"}
                </p>
              </div>
            )
          })}

          {filteredLogs.length === 0 && (
            <p className="text-sm text-zinc-500 py-4 text-center">
              {selectedPhone === "all" ? "No query activity yet." : "No queries from this member yet."}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
