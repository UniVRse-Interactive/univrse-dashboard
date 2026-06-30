import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { fetchLocalApi } from "@/lib/server-api"

interface BillingResponse { ok: boolean; data: { billing_status?: string | null; package_name?: string | null; quota_limit?: number | null; max_staff?: number | null } }

export default async function ClientBillingPage() {
  const billingRes = await fetchLocalApi<BillingResponse>("/api/client/billing")
  const billing = billingRes.json?.data ?? {}

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Billing</h1>
        <p className="text-sm text-zinc-400">Read-only billing and package information for your tenant.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-zinc-400">Billing status</CardTitle></CardHeader>
          <CardContent><Badge variant={billing.billing_status === "paid" ? "success" : "secondary"}>{billing.billing_status ?? "unknown"}</Badge></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-zinc-400">Package</CardTitle></CardHeader>
          <CardContent><p className="text-xl font-semibold text-white">{billing.package_name ?? "unknown"}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-zinc-400">Quota limit</CardTitle></CardHeader>
          <CardContent><p className="text-xl font-semibold text-white">{billing.quota_limit ?? "—"}</p></CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader><CardTitle>Package constraints</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div><p className="text-xs uppercase text-zinc-500">Max staff</p><p className="mt-1 text-lg font-semibold text-white">{billing.max_staff ?? "—"}</p></div>
          <div><p className="text-xs uppercase text-zinc-500">Note</p><p className="mt-1 text-sm text-zinc-400">PIC users cannot change billing status, package, or quota from this portal.</p></div>
        </CardContent>
      </Card>
    </div>
  )
}
