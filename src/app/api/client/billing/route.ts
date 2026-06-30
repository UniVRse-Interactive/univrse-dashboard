import { getServiceClient, requireAuth, requirePicOrOwner, resolveTenantId } from "@/lib/auth"
import { handleError, ok } from "@/lib/api-helpers"

export async function GET() {
  try {
    const ctx = await requireAuth()
    requirePicOrOwner(ctx)
    const tenantId = resolveTenantId(ctx)
    const db = getServiceClient()

    const { data: tenant, error: tenantError } = await db
      .from("tenants")
      .select("tenant_id, billing_status, package, quota_monthly")
      .eq("tenant_id", tenantId)
      .single()
    if (tenantError) throw tenantError

    const { data: limits, error: limitsError } = await db
      .from("dashboard_package_limits")
      .select("*")
      .eq("package_name", tenant.package)
      .maybeSingle()
    if (limitsError) throw limitsError

    return ok({
      billing_status: tenant.billing_status,
      package_name: tenant.package,
      quota_limit: tenant.quota_monthly,
      max_staff: limits?.max_staff ?? null,
      limits: limits ?? null,
    })
  } catch (err) {
    return handleError(err)
  }
}
