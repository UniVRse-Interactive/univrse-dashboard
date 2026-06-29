import { NextRequest } from "next/server"
import { requireAuth, requireAdmin, getServiceClient } from "@/lib/auth"
import { ok, handleError } from "@/lib/api-helpers"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ctx = await requireAuth(); requireAdmin(ctx)
    const db = getServiceClient()
    const { data: usage } = await db.from("tenant_usage").select("*").eq("tenant_id", params.id).maybeSingle()
    const { data: log } = await db.from("tenant_query_log").select("*").eq("tenant_id", params.id).order("query_at", { ascending: false }).limit(30)
    return ok({ usage: usage ?? null, recent_logs: log ?? [] })
  } catch (err) { return handleError(err) }
}
