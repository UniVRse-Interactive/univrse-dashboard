import { requireAuth, requirePicOrOwner, resolveTenantId, getServiceClient } from "@/lib/auth"
import { handleError, ok } from "@/lib/api-helpers"

export async function GET() {
  try {
    const ctx = await requireAuth()
    requirePicOrOwner(ctx)
    const tenantId = resolveTenantId(ctx)
    const db = getServiceClient()

    const [{ data: profile, error: profileError }, { data: tenant, error: tenantError }] = await Promise.all([
      db.from("tenant_agent_profiles").select("*").eq("tenant_id", tenantId).maybeSingle(),
      db.from("tenants").select("status, billing_status, company_name").eq("tenant_id", tenantId).single(),
    ])

    if (profileError) throw profileError
    if (tenantError) throw tenantError

    return ok({
      agent_name: profile?.agent_name ?? null,
      persona_preset: profile?.persona_preset ?? null,
      greeting_message: profile?.greeting_message ?? null,
      active: profile?.active ?? null,
      avatar_url: profile?.avatar_url ?? null,
      helpdesk_enabled: profile?.helpdesk_enabled ?? null,
      updated_at: profile?.updated_at ?? null,
      tenant_status: tenant?.status ?? null,
      tenant_billing_status: tenant?.billing_status ?? null,
      company_name: tenant?.company_name ?? null,
    })
  } catch (err) {
    return handleError(err)
  }
}
