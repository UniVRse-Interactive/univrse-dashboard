import { NextRequest } from "next/server"
import { requireAuth, requireAdmin, getServiceClient } from "@/lib/auth"
import { okList, handleError } from "@/lib/api-helpers"

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireAuth(); requireAdmin(ctx)
    const url = new URL(req.url)
    const page = parseInt(url.searchParams.get("page") ?? "1")
    const per = parseInt(url.searchParams.get("per_page") ?? "20")
    const db = getServiceClient()
    let q = db.from("dashboard_audit_log").select("*", { count: "exact" })
    if (url.searchParams.get("tenant_id")) q = q.eq("actor_tenant_id", url.searchParams.get("tenant_id"))
    if (url.searchParams.get("actor_id")) q = q.eq("actor_user_id", url.searchParams.get("actor_id"))
    if (url.searchParams.get("action")) q = q.eq("action", url.searchParams.get("action"))
    const { data, error, count } = await q.order("created_at", { ascending: false }).range((page - 1) * per, page * per - 1)
    if (error) throw error
    return okList(data ?? [], count ?? 0)
  } catch (err) { return handleError(err) }
}
