import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { fetchLocalApi } from "@/lib/server-api"

interface AgentData {
  agent_name?: string | null
  greeting_message?: string | null
  persona_preset?: string | null
  active?: boolean | null
  avatar_url?: string | null
  helpdesk_enabled?: boolean | null
  tenant_status?: string | null
  tenant_billing_status?: string | null
  company_name?: string | null
}

interface ActivityLog {
  id: string
  query_at: string
  route?: string | null
  response_ms?: number | null
  was_successful?: boolean | null
  phone_number?: string | null
  sender_name?: string | null
}

interface AgentResponse { ok: boolean; data: AgentData | null }
interface UsageResponse {
  ok: boolean
  data: {
    usage?: { query_count?: number; billing_period?: string | null } | null
    quota_limit?: number | null
    recent_logs?: ActivityLog[]
    tenant_status?: string | null
    tenant_billing_status?: string | null
    company_name?: string | null
    billing_period?: string | null
    package_label?: string | null
  } | null
}

function formatBillingPeriod(period: string | null | undefined): string | null {
  if (!period) return null
  const [year, month] = period.split("-")
  if (!year || !month) return period
  const date = new Date(Number(year), Number(month) - 1, 1)
  return date.toLocaleDateString("en-MY", { month: "long", year: "numeric" })
}

export default async function ClientOverviewPage() {
  const [agentRes, usageRes] = await Promise.all([
    fetchLocalApi<AgentResponse>("/api/client/agent"),
    fetchLocalApi<UsageResponse>("/api/client/usage"),
  ])

  const agent = agentRes.json?.data
  const usageData = usageRes.json?.data
  const usage = usageData?.usage
  const quota = usageData?.quota_limit ?? 0
  const queryCount = usage?.query_count ?? 0
  const percent = quota > 0 ? Math.min(100, Math.round((queryCount / quota) * 100)) : 0
  const recent = usageData?.recent_logs ?? []

  const tenantStatus = agent?.tenant_status ?? usageData?.tenant_status
  const tenantBillingStatus = agent?.tenant_billing_status ?? usageData?.tenant_billing_status
  const companyName = agent?.company_name ?? usageData?.company_name

  const isActive = agent?.active === true || tenantStatus === "trial" || tenantStatus === "active"
  const agentDisplayName = agent?.agent_name ?? (companyName ? `Hani ${companyName}` : "Hani")

  const billingLabel = (() => {
    if (tenantStatus === "trial" && tenantBillingStatus === "paid") return "Trial — Active"
    if (tenantStatus === "active" && tenantBillingStatus === "paid") return "Active"
    if (tenantBillingStatus === "overdue") return "Overdue — Action Required"
    if (tenantStatus === "suspended" || tenantBillingStatus === "suspended") return "Suspended"
    if (tenantStatus) return tenantStatus.charAt(0).toUpperCase() + tenantStatus.slice(1)
    return "Unavailable"
  })()

  const billingPeriod = formatBillingPeriod(usageData?.billing_period)
  const packageLabel = usageData?.package_label ?? null

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Client Overview</h1>
        <p className="text-sm text-zinc-400">Monitor your agent, quota, and recent traffic in one place.</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-zinc-400">Agent status</CardTitle></CardHeader>
          <CardContent>
            <p className="text-lg font-semibold text-white">{agentDisplayName}</p>
            <div className="mt-2">
              <Badge variant={isActive ? "success" : "secondary"}>{isActive ? "Active" : "Inactive"}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-zinc-400">Quota used</CardTitle></CardHeader>
          <CardContent>
            {quota > 0 ? (
              <>
                <p className="text-lg font-semibold text-white">{queryCount} / {quota}</p>
                <div className="mt-3 h-2 rounded-full bg-zinc-800">
                  <div className="h-2 rounded-full bg-gradient-to-r from-[#EE2A7B] to-[#7F3F98]" style={{ width: `${percent}%` }} />
                </div>
                <p className="mt-1 text-xs text-zinc-500">{percent}% of monthly quota</p>
              </>
            ) : (
              <p className="text-lg font-semibold text-white">
                {queryCount} <span className="text-sm font-normal text-zinc-400">messages this period</span>
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-zinc-400">Billing period</CardTitle></CardHeader>
          <CardContent>
            <p className="text-lg font-semibold text-white">{billingLabel}</p>
            {packageLabel && <p className="mt-0.5 text-sm text-zinc-300">{packageLabel}</p>}
            {billingPeriod && <p className="mt-1 text-xs text-zinc-500">{billingPeriod}</p>}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Recent query activity</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {recent.map((row) => (
            <div key={row.id} className="flex items-center justify-between rounded-xl border border-zinc-800 p-3">
              <div>
                <p className="text-sm font-medium text-white">
                  {row.sender_name ?? row.phone_number ?? "Unknown"}
                </p>
                <p className="text-xs text-zinc-500">
                  {new Date(row.query_at).toLocaleString("en-MY", { timeZone: "Asia/Kuala_Lumpur", dateStyle: "medium", timeStyle: "short" })}
                </p>
              </div>
              <div className="text-right text-xs text-zinc-400">
                <p>{row.route ?? "WhatsApp"}</p>
                <p className={row.was_successful !== false ? "text-green-500" : "text-yellow-500"}>
                  {row.was_successful !== false ? "success" : "check logs"}
                </p>
              </div>
            </div>
          ))}
          {recent.length === 0 && <p className="text-sm text-zinc-500">No recent query activity yet.</p>}
        </CardContent>
      </Card>
    </div>
  )
}
