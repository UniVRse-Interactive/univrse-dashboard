import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Link from "next/link"
import { cookies } from "next/headers"

async function fetchApi(path: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  const res = await fetch(`${base}${path}`, { headers: { Cookie: cookies().toString() }, cache: "no-store" })
  return res.json()
}

export default async function TenantsPage() {
  const result = await fetchApi("/api/admin/tenants").catch(() => ({ data: [], total: 0 }))
  const tenants = result.data ?? []

  return (
    <div className="space-y-8">
      <div><h1 className="text-2xl font-bold text-white">Tenants</h1><p className="text-sm text-zinc-400">{tenants.length} tenants</p></div>
      <Card><CardHeader><CardTitle>All Tenants</CardTitle></CardHeader><CardContent>
        {tenants.length > 0 ? (
          <Table><TableHeader><TableRow><TableHead>Company</TableHead><TableHead>Status</TableHead><TableHead>Package</TableHead><TableHead>Billing</TableHead></TableRow></TableHeader>
          <TableBody>
            {tenants.map((t: any) => (
              <TableRow key={t.tenant_id}>
                <TableCell><Link href={`/tenants/${t.tenant_id}`} className="text-[#EE2A7B] hover:underline font-medium">{t.company_name}</Link></TableCell>
                <TableCell><Badge variant={t.status === "active" ? "success" : t.status === "trial" ? "violet" : "secondary"}>{t.status}</Badge></TableCell>
                <TableCell className="text-zinc-400">{t.package_name}</TableCell>
                <TableCell className="text-zinc-400">{t.billing_status}</TableCell>
              </TableRow>
            ))}
          </TableBody></Table>
        ) : <p className="text-sm text-zinc-500">No tenants found.</p>}
      </CardContent></Card>
    </div>
  )
}
