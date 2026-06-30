import { getServiceClient } from "@/lib/auth"

interface TenantBillingSummary {
  tenant_id: string
  company_name: string
  package: string
  status: string
  billing_status: string
  quota_monthly: number
  query_count: number | null
}

async function getBillingSummaries(): Promise<TenantBillingSummary[]> {
  const db = getServiceClient()
  const period = new Date().toISOString().slice(0, 7)
  const { data: tenants } = await db
    .from("tenants")
    .select("tenant_id, company_name, package, status, billing_status, quota_monthly")
    .order("company_name")
  if (!tenants) return []
  const { data: usage } = await db
    .from("tenant_usage")
    .select("tenant_id, query_count")
    .eq("billing_period", period)
  const usageMap = new Map((usage ?? []).map((u: { tenant_id: string; query_count: number }) => [u.tenant_id, u.query_count]))
  return tenants.map((t) => ({ ...t, query_count: usageMap.get(t.tenant_id) ?? null }))
}

const BILLING_COLORS: Record<string, string> = {
  paid:      "bg-green-100 text-green-800",
  overdue:   "bg-yellow-100 text-yellow-800",
  suspended: "bg-red-100 text-red-800",
}

const STATUS_COLORS: Record<string, string> = {
  active:    "bg-green-100 text-green-800",
  trial:     "bg-blue-100 text-blue-800",
  suspended: "bg-red-100 text-red-800",
}

export default async function BillingPage() {
  const summaries = await getBillingSummaries()
  const overdue   = summaries.filter((t) => t.billing_status === "overdue")
  const suspended = summaries.filter((t) => t.billing_status === "suspended")

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Billing Overview</h1>

      {(overdue.length > 0 || suspended.length > 0) && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 space-y-1">
          <p className="font-medium text-yellow-800">Attention required</p>
          {overdue.length > 0 && (
            <p className="text-sm text-yellow-700">
              {overdue.length} tenant(s) overdue: {overdue.map((t) => t.company_name).join(", ")}
            </p>
          )}
          {suspended.length > 0 && (
            <p className="text-sm text-yellow-700">
              {suspended.length} tenant(s) suspended: {suspended.map((t) => t.company_name).join(", ")}
            </p>
          )}
        </div>
      )}

      <div className="rounded-lg border bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Tenant</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Package</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Billing</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Usage this month</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {summaries.map((t) => {
              const pct =
                t.quota_monthly > 0 && t.query_count !== null
                  ? Math.min(100, Math.round((t.query_count / t.quota_monthly) * 100))
                  : null
              return (
                <tr key={t.tenant_id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{t.company_name}</td>
                  <td className="px-4 py-3 capitalize">{t.package}</td>
                  <td className="px-4 py-3">
                    <span className={"px-2 py-0.5 rounded-full text-xs font-medium " + (STATUS_COLORS[t.status] ?? "bg-gray-100 text-gray-700")}>
                      {t.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={"px-2 py-0.5 rounded-full text-xs font-medium " + (BILLING_COLORS[t.billing_status] ?? "bg-gray-100 text-gray-700")}>
                      {t.billing_status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {pct !== null ? (
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={"h-full rounded-full " + (pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-yellow-500" : "bg-green-500")}
                            style={{ width: pct + "%" }}
                          />
                        </div>
                        <span className="text-gray-600 tabular-nums">{t.query_count}/{t.quota_monthly}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
