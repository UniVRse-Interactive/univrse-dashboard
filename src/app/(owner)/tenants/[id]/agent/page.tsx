import { AgentConfigStudio } from "@/components/owner/AgentConfigStudio"
import { fetchLocalApi } from "@/lib/server-api"

export default async function OwnerTenantAgentPage({ params }: { params: { id: string } }) {
  const [tenantRes, agentRes, requestsRes] = await Promise.all([
    fetchLocalApi<{ ok: boolean; data?: { tenant_id: string; company_name: string } | null }>(`/api/admin/tenants/${params.id}`),
    fetchLocalApi<{ ok: boolean; data?: Record<string, unknown> | null }>(`/api/admin/tenants/${params.id}/agent`),
    fetchLocalApi<{ ok: boolean; data?: Array<Record<string, unknown>> }>("/api/admin/change-requests"),
  ])

  const tenant = tenantRes.json?.data
  if (!tenant) {
    return <div className="text-zinc-400">Tenant not found.</div>
  }

  const pendingRequests = (requestsRes.json?.data ?? []).filter((item) => item.tenant_id === params.id && item.status === "pending")

  return (
    <AgentConfigStudio
      tenantId={params.id}
      tenantName={tenant.company_name}
      initialAgent={(agentRes.json?.data as any) ?? null}
      pendingRequests={pendingRequests as any[]}
    />
  )
}
