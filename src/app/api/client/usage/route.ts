import { getServiceClient, requireAuth, requirePicOrOwner, resolveTenantId } from "@/lib/auth"
import { handleError, ok } from "@/lib/api-helpers"

export async function GET() {
  try {
    const ctx = await requireAuth()
    requirePicOrOwner(ctx)
    const tenantId = resolveTenantId(ctx)
    const db = getServiceClient()

    const [{ data: usage, error: usageError }, { data: logs, error: logsError }, { data: tenant, error: tenantError }] = await Promise.all([
      db.from("tenant_usage").select("*").eq("tenant_id", tenantId).maybeSingle(),
      db.from("tenant_query_log").select("*").eq("tenant_id", tenantId).order("query_at", { ascending: false }).limit(30),
      db.from("tenants").select("quota_monthly").eq("tenant_id", tenantId).single(),
    ])

    if (usageError) throw usageError
    if (logsError) throw logsError
    if (tenantError) throw tenantError

    return ok({ usage: usage ?? null, recent_logs: logs ?? [], quota_limit: tenant.quota_monthly ?? null })
  } catch (err) {
    return handleError(err)
  }
}
