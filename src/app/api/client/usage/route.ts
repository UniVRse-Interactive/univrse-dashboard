import { getServiceClient, requireAuth, requirePicOrOwner, resolveTenantId } from "@/lib/auth"
import { handleError, ok } from "@/lib/api-helpers"

export async function GET() {
  try {
    const ctx = await requireAuth()
    requirePicOrOwner(ctx)
    const tenantId = resolveTenantId(ctx)
    const db = getServiceClient()

    const now = new Date()
    const currentPeriod = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`

    const [
      { data: usage, error: usageError },
      { data: logs, error: logsError },
      { data: tenant, error: tenantError },
    ] = await Promise.all([
      db.from("tenant_usage")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("billing_period", currentPeriod)
        .maybeSingle(),
      db.from("tenant_query_log")
        .select("id, query_at, route, response_ms, was_successful, phone_number")
        .eq("tenant_id", tenantId)
        .order("query_at", { ascending: false })
        .limit(10),
      db.from("tenants")
        .select("quota_monthly, status, billing_status, company_name")
        .eq("tenant_id", tenantId)
        .single(),
    ])

    if (usageError) throw usageError
    if (logsError) throw logsError
    if (tenantError) throw tenantError

    // Resolve sender names from tenant_numbers
    const phones = [...new Set((logs ?? []).map((l: { phone_number: string | null }) => l.phone_number).filter((p): p is string => Boolean(p)))]
    let nameMap: Record<string, string | null> = {}
    if (phones.length > 0) {
      const { data: numbers } = await db
        .from("tenant_numbers")
        .select("phone_number, name")
        .eq("tenant_id", tenantId)
        .in("phone_number", phones)
      nameMap = Object.fromEntries((numbers ?? []).map((n: { phone_number: string; name: string | null }) => [n.phone_number, n.name ?? null]))
    }

    const enrichedLogs = (logs ?? []).map((l: { phone_number: string | null; [key: string]: unknown }) => ({
      ...l,
      sender_name: l.phone_number ? (nameMap[l.phone_number] ?? null) : null,
    }))

    return ok({
      usage: usage ?? null,
      recent_logs: enrichedLogs,
      quota_limit: tenant?.quota_monthly ?? null,
      tenant_status: tenant?.status ?? null,
      tenant_billing_status: tenant?.billing_status ?? null,
      company_name: tenant?.company_name ?? null,
      billing_period: currentPeriod,
    })
  } catch (err) {
    return handleError(err)
  }
}
