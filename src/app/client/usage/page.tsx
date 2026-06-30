import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { fetchLocalApi } from "@/lib/server-api"

interface UsageResponse { ok: boolean; data: { usage?: { query_count?: number; billing_period?: string | null } | null; quota_limit?: number | null; recent_logs?: Array<{ id: string; query_at: string; route?: string | null; response_ms?: number | null; was_successful?: boolean | null; kb_results_count?: number | null }> } }

export default async function ClientUsagePage() {
  const usageRes = await fetchLocalApi<UsageResponse>("/api/client/usage")
  const usage = usageRes.json?.data?.usage
  const quota = usageRes.json?.data?.quota_limit ?? 0
  const recent = usageRes.json?.data?.recent_logs ?? []

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Usage & Quota</h1>
        <p className="text-sm text-zinc-400">Track your tenant usage against the live monthly quota.</p>
      </div>
      <Card>
        <CardHeader><CardTitle>Usage snapshot</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div><p className="text-xs uppercase text-zinc-500">Queries used</p><p className="mt-1 text-2xl font-semibold text-white">{usage?.query_count ?? 0}</p></div>
          <div><p className="text-xs uppercase text-zinc-500">Quota limit</p><p className="mt-1 text-2xl font-semibold text-white">{quota || "—"}</p></div>
          <div><p className="text-xs uppercase text-zinc-500">Billing period</p><p className="mt-1 text-2xl font-semibold text-white">{usage?.billing_period ?? "Unknown"}</p></div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Last 30 query events</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {recent.map((row) => (
            <div key={row.id} className="grid gap-2 rounded-xl border border-zinc-800 p-4 md:grid-cols-4">
              <div><p className="text-xs uppercase text-zinc-500">Time</p><p className="mt-1 text-sm text-white">{new Date(row.query_at).toLocaleString()}</p></div>
              <div><p className="text-xs uppercase text-zinc-500">Route</p><p className="mt-1 text-sm text-white">{row.route ?? "query"}</p></div>
              <div><p className="text-xs uppercase text-zinc-500">Latency</p><p className="mt-1 text-sm text-white">{row.response_ms ?? "—"} ms</p></div>
              <div><p className="text-xs uppercase text-zinc-500">Result</p><p className="mt-1 text-sm text-white">{row.was_successful ? "success" : "check logs"}</p></div>
            </div>
          ))}
          {recent.length === 0 && <p className="text-sm text-zinc-500">No usage logs available yet.</p>}
        </CardContent>
      </Card>
    </div>
  )
}
