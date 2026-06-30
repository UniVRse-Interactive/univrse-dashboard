import { NextRequest } from "next/server"
import { getServiceClient, requireAuth, requirePicOrOwner, resolveTenantId } from "@/lib/auth"
import { handleError, ok, okList, ValidationError } from "@/lib/api-helpers"
import { setActorContext } from "@/lib/utils/actor"

const ALLOWED_TYPES = ["agent_name", "persona", "greeting", "language", "helpdesk", "other"]

export async function GET() {
  try {
    const ctx = await requireAuth()
    requirePicOrOwner(ctx)
    const tenantId = resolveTenantId(ctx)
    const db = getServiceClient()
    const { data, error, count } = await db
      .from("agent_change_requests")
      .select("*", { count: "exact" })
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
    if (error) throw error
    return okList(data ?? [], count ?? 0)
  } catch (err) {
    return handleError(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireAuth()
    requirePicOrOwner(ctx)
    const tenantId = resolveTenantId(ctx)
    const body = await req.json()
    const { change_type, old_value, new_value, notes } = body
    if (!ALLOWED_TYPES.includes(change_type)) throw new ValidationError("Invalid change_type")
    if (!new_value) throw new ValidationError("new_value is required")
    const db = getServiceClient()
    await setActorContext(db, ctx.userId, ctx.role, req.headers.get("x-forwarded-for") ?? "")
    const { data, error } = await db
      .from("agent_change_requests")
      .insert({
        tenant_id: tenantId,
        requested_by: ctx.userId,
        change_type,
        old_value: old_value ?? null,
        new_value,
        approval_note: notes ?? null,
        status: "pending",
      })
      .select("*")
      .single()
    if (error) throw error
    return ok(data, 201)
  } catch (err) {
    return handleError(err)
  }
}
