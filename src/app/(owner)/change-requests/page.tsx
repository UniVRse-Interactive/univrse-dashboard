import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cookies } from "next/headers"

async function fetchApi(path: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  const res = await fetch(`${base}${path}`, { headers: { Cookie: cookies().toString() }, cache: "no-store" })
  return res.json()
}

export default async function ChangeRequestsPage() {
  const result = await fetchApi("/api/admin/change-requests").catch(() => ({ data: [], total: 0 }))
  const requests = result.data ?? []

  return (
    <div className="space-y-8">
      <div><h1 className="text-2xl font-bold text-white">Change Requests</h1><p className="text-sm text-zinc-400">{requests.length} pending</p></div>
      <Card><CardHeader><CardTitle>Pending Requests</CardTitle></CardHeader><CardContent>
        {requests.length > 0 ? requests.map((r: any) => (
          <div key={r.id} className="flex items-center justify-between rounded-lg border border-zinc-800 p-3 mb-2">
            <div><p className="font-medium text-white">{r.change_type}</p><p className="text-xs text-zinc-500">Tenant: {r.tenants?.company_name ?? r.tenant_id}</p></div>
            <Badge variant="warning">pending</Badge>
          </div>
        )) : <p className="text-sm text-zinc-500">No pending change requests.</p>}
      </CardContent></Card>
    </div>
  )
}
