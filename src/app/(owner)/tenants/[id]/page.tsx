import { TenantDetailTabs } from "@/components/owner/TenantDetailTabs"
import { fetchLocalApi } from "@/lib/server-api"

export default async function TenantDetailPage({ params }: { params: { id: string } }) {
  const [tenantRes, agentRes, usageRes, billingRes] = await Promise.all([
    fetchLocalApi<{ ok: boolean; data?: Record<string, unknown> | null }>(`/api/admin/tenants/${params.id}`),
    fetchLocalApi<{ ok: boolean; data?: Record<string, unknown> | null }>(`/api/admin/tenants/${params.id}/agent`),
    fetchLocalApi<{ ok: boolean; data?: { usage?: Record<string, unknown> | null } | null }>(`/api/admin/tenants/${params.id}/usage`),
    fetchLocalApi<{ ok: boolean; data?: Record<string, unknown> | null }>(`/api/admin/tenants/${params.id}/billing`),
  ])

  const tenant = tenantRes.json?.data
  if (!tenant) return <div className="text-zinc-400">Tenant not found</div>

  return (
    <TenantDetailTabs
      tenant={tenant}
      agent={agentRes.json?.data ?? null}
      usage={usageRes.json?.data ?? null}
      billing={billingRes.json?.data ?? null}
    />
  )
}
