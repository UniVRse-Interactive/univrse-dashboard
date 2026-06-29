import { NextRequest } from "next/server"
import { requireAuth, requireAdmin, getServiceClient } from "@/lib/auth"
import { okList, handleError } from "@/lib/api-helpers"

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireAuth(); requireAdmin(ctx)
    const db = getServiceClient()
    const { data, error, count } = await db
      .from("agent_change_requests")
      .select("*, tenants(company_name)")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
    if (error) throw error
    return okList(data ?? [], count ?? 0)
  } catch (err) { return handleError(err) }
}
