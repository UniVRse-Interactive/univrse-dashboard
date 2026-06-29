import { NextRequest } from "next/server"
import { requireAuth, requireAdmin, getServiceClient } from "@/lib/auth"
import { ok, handleError, ValidationError } from "@/lib/api-helpers"

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ctx = await requireAuth(); requireAdmin(ctx)
    const body = await req.json()
    const { action, approval_note } = body
    if (!action || !["approve", "reject"].includes(action)) throw new ValidationError("action must be approve or reject")
    const db = getServiceClient()
    if (action === "approve") {
      if (!approval_note) throw new ValidationError("approval_note is required for approval")
      const { data, error } = await db.rpc("approve_agent_change_request", {
        p_request_id: params.id,
        p_approved_by: ctx.userId,
        p_approval_note: approval_note,
      })
      if (error) throw error
      return ok(data)
    }
    const { data, error } = await db.rpc("reject_agent_change_request", {
      p_request_id: params.id,
      p_rejected_by: ctx.userId,
      p_rejection_note: approval_note ?? "",
    })
    if (error) throw error
    return ok(data)
  } catch (err) { return handleError(err) }
}
