import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cookies } from "next/headers"

async function fetchApi(path: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  const res = await fetch(`${base}${path}`, { headers: { Cookie: cookies().toString() }, cache: "no-store" })
  return res.json()
}

export default async function OverviewPage() {
  const tenants = await fetchApi("/api/admin/tenants").catch(() => ({ data: [], total: 0 }))
  const tenantList = tenants.data ?? []
  const activeCount = tenantList.filter((t: any) => t.status === "active").length
  const trialCount = tenantList.filter((t: any) => t.status === "trial").length

  return (
    <div className="space-y-8">
      <div><h1 className="text-2xl font-bold text-white">Executive Overview</h1><p className="text-sm text-zinc-400">UniVRse operations dashboard</p></div>
      <div className="grid grid-cols-4 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-zinc-400">Total Tenants</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-white">{tenantList.length}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-zinc-400">Active</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-[#EE2A7B]">{activeCount}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-zinc-400">Trial</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-[#7F3F98]">{trialCount}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-zinc-400">Status</CardTitle></CardHeader><CardContent><Badge variant="success">D3 Live</Badge></CardContent></Card>
      </div>
      <Card><CardHeader><CardTitle>Recent Tenants</CardTitle></CardHeader><CardContent>
        {tenantList.length > 0 ? tenantList.slice(0, 5).map((t: any) => (
          <div key={t.tenant_id} className="flex items-center justify-between rounded-lg border border-zinc-800 p-3 mb-2">
            <div><p className="font-medium text-white">{t.company_name}</p><p className="text-xs text-zinc-500">{t.package_name} · {t.billing_status}</p></div>
            <Badge variant={t.status === "active" ? "success" : t.status === "trial" ? "violet" : "secondary"}>{t.status}</Badge>
          </div>
        )) : <p className="text-sm text-zinc-500">No tenants yet.</p>}
      </CardContent></Card>
    </div>
  )
}
