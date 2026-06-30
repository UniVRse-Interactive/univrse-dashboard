import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { fetchLocalApi } from "@/lib/server-api"

interface AgentResponse { ok: boolean; data: { agent_name?: string | null; greeting_message?: string | null; persona_preset?: string | null; active?: boolean | null } | null }
interface UsageResponse { ok: boolean; data: { usage?: { query_count?: number; billing_period?: string | null } | null; quota_limit?: number | null; recent_logs?: Array<{ id: string; query_at: string; route?: string | null; response_ms?: number | null; was_successful?: boolean | null }> } }

export default async function ClientOverviewPage() {
  const [agentRes, usageRes] = await Promise.all([
    fetchLocalApi<AgentResponse>("/api/client/agent"),
    fetchLocalApi<UsageResponse>("/api/client/usage"),
  ])

  const agent = agentRes.json?.data
  const usage = usageRes.json?.data?.usage
  const quota = usageRes.json?.data?.quota_limit ?? 0
  const queryCount = usage?.query_count ?? 0
  const percent = quota > 0 ? Math.min(100, Math.round((queryCount / quota) * 100)) : 0
  const recent = usageRes.json?.data?.recent_logs ?? []

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
            <p className="text-lg font-semibold text-white">{agent?.agent_name ?? "No agent profile yet"}</p>
            <div className="mt-2">{typeof agent?.active === "boolean" ? <Badge variant={agent.active ? "success" : "secondary"}>{agent.active ? "Active" : "Inactive"}</Badge> : <Badge variant="secondary">Pending setup</Badge>}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-zinc-400">Quota used</CardTitle></CardHeader>
          <CardContent>
            <p className="text-lg font-semibold text-white">{queryCount} / {quota || "—"}</p>
            <div className="mt-3 h-2 rounded-full bg-zinc-800"><div className="h-2 rounded-full bg-gradient-to-r from-[#EE2A7B] to-[#7F3F98]" style={{ width: `${percent}%` }} /></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-zinc-400">Billing period</CardTitle></CardHeader>
          <CardContent><p className="text-lg font-semibold text-white">{usage?.billing_period ?? "Current period unavailable"}</p></CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader><CardTitle>Recent query activity</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {recent.map((row) => (
            <div key={row.id} className="flex items-center justify-between rounded-xl border border-zinc-800 p-3">
              <div>
                <p className="text-sm font-medium text-white">{row.route ?? "query"}</p>
                <p className="text-xs text-zinc-500">{new Date(row.query_at).toLocaleString()}</p>
              </div>
              <div className="text-right text-xs text-zinc-400">
                <p>{row.response_ms ?? "—"} ms</p>
                <p>{row.was_successful ? "success" : "check logs"}</p>
              </div>
            </div>
          ))}
          {recent.length === 0 && <p className="text-sm text-zinc-500">No recent query activity yet.</p>}
        </CardContent>
      </Card>
    </div>
  )
}
