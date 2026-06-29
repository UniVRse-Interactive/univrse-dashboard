import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cookies } from "next/headers"

async function fetchApi(path: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  const res = await fetch(`${base}${path}`, { headers: { Cookie: cookies().toString() }, cache: "no-store" })
  return res.json()
}

export default async function TenantDetailPage({ params }: { params: { id: string } }) {
  const tenant = await fetchApi(`/api/admin/tenants/${params.id}`).catch(() => ({ data: null }))
  const agent = await fetchApi(`/api/admin/tenants/${params.id}/agent`).catch(() => ({ data: null }))
  const usage = await fetchApi(`/api/admin/tenants/${params.id}/usage`).catch(() => ({ data: { usage: null } }))
  const billing = await fetchApi(`/api/admin/tenants/${params.id}/billing`).catch(() => ({ data: {} }))
  const t = tenant.data

  if (!t) return <div className="text-zinc-400">Tenant not found</div>

  return (
    <div className="space-y-8">
      <div><h1 className="text-2xl font-bold text-white">{t.company_name}</h1><p className="text-sm text-zinc-400">Tenant ID: {t.tenant_id}</p></div>
      <div className="grid grid-cols-3 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-zinc-400">Status</CardTitle></CardHeader><CardContent><Badge variant={t.status === "active" ? "success" : "violet"}>{t.status}</Badge></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-zinc-400">Package</CardTitle></CardHeader><CardContent><p className="text-xl font-bold text-white">{t.package_name}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-zinc-400">Billing</CardTitle></CardHeader><CardContent><p className="text-xl font-bold text-white">{billing.data?.billing_status ?? t.billing_status}</p></CardContent></Card>
      </div>
      <Card><CardHeader><CardTitle>Agent Profile</CardTitle></CardHeader><CardContent>
        {agent.data ? <div className="grid grid-cols-2 gap-4 text-sm"><div><span className="text-zinc-400">Name:</span> <span className="text-white">{agent.data.agent_display_name}</span></div><div><span className="text-zinc-400">Language:</span> <span className="text-white">{agent.data.default_language}</span></div><div><span className="text-zinc-400">Active:</span> <Badge variant={agent.data.is_active ? "success" : "secondary"}>{String(agent.data.is_active)}</Badge></div><div><span className="text-zinc-400">Helpdesk:</span> <Badge variant={agent.data.helpdesk_enabled ? "success" : "secondary"}>{String(agent.data.helpdesk_enabled)}</Badge></div></div> : <p className="text-sm text-zinc-500">No agent profile yet.</p>}
      </CardContent></Card>
      <Card><CardHeader><CardTitle>Usage</CardTitle></CardHeader><CardContent>
        {usage.data?.usage ? <p className="text-white">Queries: {usage.data.usage.query_count} / {usage.data.usage.quota_limit ?? "unlimited"}</p> : <p className="text-sm text-zinc-500">No usage data.</p>}
      </CardContent></Card>
    </div>
  )
}
