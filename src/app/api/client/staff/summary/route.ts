import { getServiceClient, requireAuth, requirePicOrOwner, resolveTenantId } from "@/lib/auth"
import { handleError, ok } from "@/lib/api-helpers"

const PACKAGE_LABELS: Record<string, string> = {
  starter: "Starter Package",
  business: "Business Package",
  enterprise: "Enterprise Package",
}

export async function GET() {
  try {
    const ctx = await requireAuth()
    requirePicOrOwner(ctx)
    const tenantId = resolveTenantId(ctx)
    const db = getServiceClient()

    const now = new Date()
    const currentPeriod = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`

    const [
      { data: tenant, error: tenantError },
      { count: seatUsed, error: seatError },
      { data: usage, error: usageError },
      { data: logRows, error: logError },
    ] = await Promise.all([
      db.from("tenants").select("package, quota_monthly").eq("tenant_id", tenantId).single(),
      db.from("tenant_numbers").select("*", { count: "exact", head: true }).eq("tenant_id", tenantId).eq("authorized", true),
      db.from("tenant_usage").select("query_count").eq("tenant_id", tenantId).eq("billing_period", currentPeriod).maybeSingle(),
      db.from("tenant_query_log").select("phone_number").eq("tenant_id", tenantId).eq("billing_period", currentPeriod),
    ])

    if (tenantError) throw tenantError
    if (seatError) throw seatError
    if (usageError) throw usageError
    if (logError) throw logError

    const { data: limits } = await db
      .from("dashboard_package_limits")
      .select("max_staff")
      .eq("package_name", tenant?.package ?? "")
      .maybeSingle()

    const memberUsage: Record<string, number> = {}
    for (const row of logRows ?? []) {
      if (row.phone_number) {
        memberUsage[row.phone_number] = (memberUsage[row.phone_number] ?? 0) + 1
      }
    }

    return ok({
      seat_total: limits?.max_staff ?? 100,
      seat_used: seatUsed ?? 0,
      package_label: PACKAGE_LABELS[tenant?.package ?? ""] ?? null,
      company_quota: tenant?.quota_monthly ?? 0,
      company_used: usage?.query_count ?? 0,
      billing_period: currentPeriod,
      member_usage: memberUsage,
    })
  } catch (err) {
    return handleError(err)
  }
}
