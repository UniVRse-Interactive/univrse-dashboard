import { requireAuth, requirePicOrOwner, resolveTenantId, getServiceClient } from "@/lib/auth"
import { handleError, ok } from "@/lib/api-helpers"

export async function GET() {
  try {
    const ctx = await requireAuth()
    requirePicOrOwner(ctx)
    const tenantId = resolveTenantId(ctx)
    const db = getServiceClient()
    const { data, error } = await db.from("tenant_agent_profiles").select("*").eq("tenant_id", tenantId).maybeSingle()
    if (error) throw error
    return ok(data ?? null)
  } catch (err) {
    return handleError(err)
  }
}
