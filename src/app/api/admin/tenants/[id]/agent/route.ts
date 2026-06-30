import { NextRequest } from "next/server"
import { getServiceClient, requireAdmin, requireAuth } from "@/lib/auth"
import { handleError, ok, ValidationError } from "@/lib/api-helpers"

function normalizeNonEmpty(value: unknown) {
  if (typeof value !== "string") return undefined
  const trimmed = value.trim()
  return trimmed ? trimmed : undefined
}

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ctx = await requireAuth()
    requireAdmin(ctx)
    const db = getServiceClient()
    const { data, error } = await db.from("tenant_agent_profiles").select("*").eq("tenant_id", params.id).maybeSingle()
    if (error) throw error
    return ok(data ?? null)
  } catch (err) {
    return handleError(err)
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ctx = await requireAuth()
    requireAdmin(ctx)

    const body = await req.json()
    const updates: Record<string, unknown> = {}
    const agentName = normalizeNonEmpty(body.agent_name)
    const personaPreset = normalizeNonEmpty(body.persona_preset)

    if (agentName) updates.agent_name = agentName
    if (personaPreset) updates.persona_preset = personaPreset
    if (typeof body.greeting_message === "string") updates.greeting_message = body.greeting_message.trim()
    if (typeof body.active === "boolean") updates.active = body.active
    if (typeof body.helpdesk_enabled === "boolean") updates.helpdesk_enabled = body.helpdesk_enabled

    if (Object.keys(updates).length === 0) throw new ValidationError("No valid fields")

    const db = getServiceClient()
    const existing = await db.from("tenant_agent_profiles").select("tenant_id").eq("tenant_id", params.id).maybeSingle()

    let data
    if (existing.data) {
      const result = await db.from("tenant_agent_profiles").update(updates).eq("tenant_id", params.id).select("*").single()
      if (result.error) throw result.error
      data = result.data
    } else {
      const result = await db.from("tenant_agent_profiles").insert({ tenant_id: params.id, ...updates }).select("*").single()
      if (result.error) throw result.error
      data = result.data
    }

    const matchingTypes = [
      agentName ? "agent_name" : null,
      personaPreset ? "persona" : null,
      typeof body.greeting_message === "string" ? "greeting" : null,
      typeof body.helpdesk_enabled === "boolean" ? "helpdesk" : null,
    ].filter(Boolean) as string[]

    if (matchingTypes.length > 0) {
      const { error: approvalError } = await db
        .from("agent_change_requests")
        .update({
          status: "approved",
          approved_by: ctx.userId,
          approval_note: "Auto-approved after direct owner agent update",
          resolved_at: new Date().toISOString(),
        })
        .eq("tenant_id", params.id)
        .eq("status", "pending")
        .in("change_type", matchingTypes)

      if (approvalError) throw approvalError
    }

    return ok(data, existing.data ? 200 : 201)
  } catch (err) {
    return handleError(err)
  }
}
