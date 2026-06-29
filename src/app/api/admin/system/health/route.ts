import { requireAuth, requireAdmin, getServiceClient } from "@/lib/auth"
import { ok, handleError } from "@/lib/api-helpers"

export async function GET() {
  try {
    const ctx = await requireAuth(); requireAdmin(ctx)
    const db = getServiceClient()
    const { count } = await db.from("tenants").select("*", { count: "exact", head: true })
    const { count: activeCount } = await db.from("tenants").select("*", { count: "exact", head: true }).eq("status", "active")
    return ok({ db: "ok", tenantCount: count ?? 0, activeTenants: activeCount ?? 0, timestamp: new Date().toISOString() })
  } catch (err) { return handleError(err) }
}
