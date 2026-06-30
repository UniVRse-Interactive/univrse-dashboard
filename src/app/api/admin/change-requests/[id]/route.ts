import { getServiceClient, requireAdmin, requireAuth } from "@/lib/auth"
import { handleError, ok, ValidationError } from "@/lib/api-helpers"

function parseBooleanLike(value: string) {
  const normalized = value.trim().toLowerCase()
  if (["true", "1", "yes", "enabled", "on"].includes(normalized)) return true
  if (["false", "0", "no", "disabled", "off"].includes(normalized)) return false
  throw new ValidationError("helpdesk change request value must be true or false")
}

function requestToProfileUpdate(changeType: string, newValue: string): Record<string, unknown> {
  switch (changeType) {
    case "agent_name":
      return { agent_name: newValue.trim() }
    case "persona":
      return { persona_preset: newValue.trim() }
    case "greeting":
      return { greeting_message: newValue }
    case "helpdesk":
      return { helpdesk_enabled: parseBooleanLike(newValue) }
    default:
      return {}
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const ctx = await requireAuth()
    requireAdmin(ctx)

    const body = await req.json().catch(() => ({}))
    const action = body?.action
    const approvalNote = typeof body?.approval_note === "string" ? body.approval_note.trim() : null
    if (action !== "approve" && action !== "reject") throw new ValidationError("action must be approve or reject")

    const db = getServiceClient()
    const { data: request, error: requestError } = await db.from("agent_change_requests").select("*").eq("id", params.id).maybeSingle()
    if (requestError) throw requestError
    if (!request) throw new ValidationError("Change request not found")
    if (request.status !== "pending") throw new ValidationError("Change request is already resolved")

    if (action === "approve") {
      const updates = requestToProfileUpdate(request.change_type, request.new_value ?? "")
      if (Object.keys(updates).length > 0) {
        const existing = await db.from("tenant_agent_profiles").select("tenant_id").eq("tenant_id", request.tenant_id).maybeSingle()
        if (existing.error) throw existing.error
        if (existing.data) {
          const result = await db.from("tenant_agent_profiles").update(updates).eq("tenant_id", request.tenant_id).select("*").single()
          if (result.error) throw result.error
        } else {
          const result = await db.from("tenant_agent_profiles").insert({ tenant_id: request.tenant_id, ...updates }).select("*").single()
          if (result.error) throw result.error
        }
      }
    }

    const status = action === "approve" ? "approved" : "rejected"
    const { data, error } = await db
      .from("agent_change_requests")
      .update({
        status,
        approved_by: ctx.userId,
        approval_note: approvalNote,
        resolved_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select("*")
      .single()

    if (error) throw error
    return ok(data)
  } catch (err) {
    return handleError(err)
  }
}
