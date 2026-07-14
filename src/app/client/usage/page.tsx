import { fetchLocalApi } from "@/lib/server-api"
import { UsageDashboard } from "@/components/client/UsageDashboard"

interface UsageApiResponse {
  ok: boolean
  data: {
    usage?: { query_count?: number } | null
    quota_limit?: number | null
    recent_logs?: Array<{
      id: string
      query_at: string
      route?: string | null
      response_ms?: number | null
      was_successful?: boolean | null
      phone_number?: string | null
      sender_name?: string | null
    }>
    tenant_status?: string | null
    tenant_billing_status?: string | null
    company_name?: string | null
    billing_period?: string | null
    package_label?: string | null
  } | null
}

interface StaffApiResponse {
  ok: boolean
  data: Array<{ id: string; phone_number: string; name?: string | null; role: string; authorized?: boolean | null }>
}

interface SummaryApiResponse {
  ok: boolean
  data: {
    seat_total: number
    seat_used: number
    package_label: string | null
    company_quota: number
    company_used: number
    billing_period: string
    member_usage: Record<string, number>
  } | null
}

export default async function ClientUsagePage() {
  const [usageRes, staffRes, summaryRes] = await Promise.all([
    fetchLocalApi<UsageApiResponse>("/api/client/usage"),
    fetchLocalApi<StaffApiResponse>("/api/client/staff"),
    fetchLocalApi<SummaryApiResponse>("/api/client/staff/summary"),
  ])

  const usageData = usageRes.json?.data
  const numbers = staffRes.json?.data ?? []
  const summary = summaryRes.json?.data

  const companyQuota = summary?.company_quota ?? usageData?.quota_limit ?? 0
  const companyUsed = summary?.company_used ?? usageData?.usage?.query_count ?? 0
  const memberUsage = summary?.member_usage ?? {}
  const billingPeriod = usageData?.billing_period ?? summary?.billing_period ?? null
  const packageLabel = usageData?.package_label ?? summary?.package_label ?? null

  // Sort: pic first, then members alphabetically
  const sortedNumbers = [...numbers].sort((a, b) => {
    if (a.role === "pic" && b.role !== "pic") return -1
    if (a.role !== "pic" && b.role === "pic") return 1
    return (a.name ?? a.phone_number).localeCompare(b.name ?? b.phone_number)
  })

  const memberRows = sortedNumbers.map((n) => {
    const isPic = n.role === "pic"
    const used = memberUsage[n.phone_number] ?? 0
    const cap = isPic ? null : 300
    const pct = cap ? Math.min(100, Math.round((used / cap) * 100)) : 0
    return { phone_number: n.phone_number, name: n.name ?? null, role: n.role, used, cap, pct }
  })

  const knownPhones = new Set(numbers.map((n) => n.phone_number))
  const otherUsage = Object.entries(memberUsage)
    .filter(([p]) => !knownPhones.has(p))
    .reduce((sum, [, count]) => sum + count, 0)

  const logs = (usageData?.recent_logs ?? []).map((l) => ({
    id: l.id,
    query_at: l.query_at,
    route: l.route ?? null,
    response_ms: l.response_ms ?? null,
    was_successful: l.was_successful ?? null,
    phone_number: l.phone_number ?? null,
    sender_name: l.sender_name ?? null,
  }))

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Usage & Quota</h1>
        <p className="text-sm text-zinc-400">Analytics for your team&apos;s Hani usage this period.</p>
      </div>
      <UsageDashboard
        summary={{ billingPeriod, companyUsed, companyQuota, packageLabel }}
        memberRows={memberRows}
        otherUsage={otherUsage}
        logs={logs}
        members={sortedNumbers.map((n) => ({ phone_number: n.phone_number, name: n.name }))}
      />
    </div>
  )
}
