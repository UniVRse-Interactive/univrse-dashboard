import { NextRequest } from "next/server"
import { getServiceClient, requireAdmin, requireAuth } from "@/lib/auth"
import { handleError, ok, ValidationError } from "@/lib/api-helpers"

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ctx = await requireAuth()
    requireAdmin(ctx)

    if (!UUID_RE.test(params.id)) throw new ValidationError("Invalid tenant id")

    const { searchParams } = new URL(req.url)
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 100)
    const offset = parseInt(searchParams.get("offset") ?? "0", 10)

    const db = getServiceClient()
    const { data, error, count } = await db
      .from("public_helpdesk_conversations")
      .select("*", { count: "exact" })
      .eq("tenant_id", params.id)
      .order("started_at", { ascending: false })
      .range(offset, offset + limit - 1)
    if (error) throw error

    return ok({ conversations: data ?? [], total: count ?? 0, limit, offset })
  } catch (err) {
    return handleError(err)
  }
}
