import { NextRequest } from "next/server"
import { requireAuth, requireAdmin, getServiceClient } from "@/lib/auth"
import { ok, handleError, ValidationError } from "@/lib/api-helpers"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ctx = await requireAuth(); requireAdmin(ctx)
    const db = getServiceClient()
    const { data, error } = await db.from("tenant_agent_profiles").select("*").eq("tenant_id", params.id).maybeSingle()
    if (error) throw error
    return ok(data ?? null)
  } catch (err) { return handleError(err) }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ctx = await requireAuth(); requireAdmin(ctx)
    const body = await req.json()
    const { agent_display_name, greeting_message, default_language, is_active, helpdesk_enabled } = body
    const updates: Record<string, unknown> = {}
    if (agent_display_name) updates.agent_display_name = agent_display_name
    if (greeting_message) updates.greeting_message = greeting_message
    if (default_language) updates.default_language = default_language
    if (typeof is_active === "boolean") updates.is_active = is_active
    if (typeof helpdesk_enabled === "boolean") updates.helpdesk_enabled = helpdesk_enabled
    if (Object.keys(updates).length === 0) throw new ValidationError("No valid fields")
    const db = getServiceClient()
    const existing = await db.from("tenant_agent_profiles").select("tenant_id").eq("tenant_id", params.id).maybeSingle()
    if (existing.data) {
      const { data, error } = await db.from("tenant_agent_profiles").update(updates).eq("tenant_id", params.id).select("*").single()
      if (error) throw error
      return ok(data)
    }
    const { data, error } = await db.from("tenant_agent_profiles").insert({ tenant_id: params.id, ...updates }).select("*").single()
    if (error) throw error
    return ok(data, 201)
  } catch (err) { return handleError(err) }
}
