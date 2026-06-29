import { NextRequest } from "next/server"
import { requireAuth, requireAdmin, getServiceClient } from "@/lib/auth"
import { okList, handleError } from "@/lib/api-helpers"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ctx = await requireAuth(); requireAdmin(ctx)
    const url = new URL(req.url)
    const page = parseInt(url.searchParams.get("page") ?? "1")
    const per = parseInt(url.searchParams.get("per_page") ?? "20")
    const db = getServiceClient()
    const { data, error, count } = await db
      .from("dashboard_audit_log")
      .select("*", { count: "exact" })
      .or(`actor_tenant_id.eq.${params.id},target_tenant_id.eq.${params.id}`)
      .order("created_at", { ascending: false })
      .range((page - 1) * per, page * per - 1)
    if (error) throw error
    return okList(data ?? [], count ?? 0)
  } catch (err) { return handleError(err) }
}
