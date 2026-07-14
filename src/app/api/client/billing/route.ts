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
      .select("billing_status, package, quota_monthly, status")
      .eq("tenant_id", tenantId)
      .single()
    if (tenantError) throw tenantError

    const now = new Date()
    const currentPeriod = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`

    const [
      { data: limits, error: limitsError },
      { count: seatUsed, error: seatError },
      { data: usage, error: usageError },
    ] = await Promise.all([
      db.from("dashboard_package_limits").select("*").eq("package_name", tenant.package).maybeSingle(),
      db.from("tenant_numbers").select("*", { count: "exact", head: true }).eq("tenant_id", tenantId).eq("authorized", true),
      db.from("tenant_usage").select("query_count").eq("tenant_id", tenantId).eq("billing_period", currentPeriod).maybeSingle(),
    ])
    if (limitsError) throw limitsError
    if (seatError) throw seatError
    if (usageError) throw usageError

    return ok({
      billing_status: tenant.billing_status,
      tenant_status: tenant.status,
      package_name: tenant.package,
      quota_limit: tenant.quota_monthly,
      max_staff: limits?.max_staff ?? null,
      limits: limits ?? null,
      seat_used: seatUsed ?? 0,
      company_used: usage?.query_count ?? 0,
      billing_period: currentPeriod,
    })
  } catch (err) {
    return handleError(err)
  }
}
