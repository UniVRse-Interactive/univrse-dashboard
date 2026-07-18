import { NextRequest, NextResponse } from "next/server"
import { getServiceClient } from "@/lib/auth"
import { handleError, ok, ValidationError } from "@/lib/api-helpers"

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const MAX_TEXT_LENGTH = 2000

function originAllowed(origin: string | null, allowed: unknown): boolean {
  if (!origin) return false
  if (!Array.isArray(allowed)) return false
  return (allowed as string[]).includes(origin)
}

export async function POST(req: NextRequest) {
  try {
    const origin = req.headers.get("origin")
    const body = await req.json()
    const conversation_id = typeof body.conversation_id === "string" ? body.conversation_id.trim() : ""
    const visitor_name = typeof body.visitor_name === "string" ? body.visitor_name.trim() : null
    const visitor_contact = typeof body.visitor_contact === "string" ? body.visitor_contact.trim() : null
    const query_text = typeof body.query_text === "string" ? body.query_text.trim() : ""

    if (!UUID_RE.test(conversation_id)) throw new ValidationError("conversation_id must be a valid UUID")
    if (!query_text) throw new ValidationError("query_text is required")
    if (query_text.length > MAX_TEXT_LENGTH) throw new ValidationError("query_text too long")

    const db = getServiceClient()
    const { data: conv, error: convError } = await db
      .from("public_helpdesk_conversations")
      .select("conversation_id, widget_id, tenant_id, escalated")
      .eq("conversation_id", conversation_id)
      .maybeSingle()
    if (convError) throw convError
    if (!conv) {
      return NextResponse.json({ ok: false, error: { code: "CONVERSATION_NOT_FOUND" } }, { status: 404 })
    }

    const { data: widget, error: widgetError } = await db
      .from("public_widget_identities")
      .select("widget_id, config_id, allowed_origins, status")
      .eq("widget_id", conv.widget_id)
      .maybeSingle()
    if (widgetError) throw widgetError
    if (!widget || widget.status !== "active") {
      return NextResponse.json({ ok: false, error: { code: "WIDGET_NOT_ACTIVE" } }, { status: 403 })
    }
    if (!originAllowed(origin, widget.allowed_origins)) {
      return NextResponse.json({ ok: false, error: { code: "ORIGIN_NOT_ALLOWED" } }, { status: 403 })
    }

    // Phase 0: notification_status stays 'disabled' — no outbound WA/n8n delivery.
    // notification_status = 'pending' only when ESCALATION_DELIVERY_ENABLED is set (Phase 1).
    const { data: handoff, error: handoffError } = await db
      .from("public_helpdesk_handoffs")
      .insert({
        conversation_id,
        tenant_id: conv.tenant_id,
        visitor_name,
        visitor_contact,
        query_text,
        notification_status: "disabled",
      })
      .select("handoff_id")
      .single()
    if (handoffError) throw handoffError

    await db
      .from("public_helpdesk_guardrail_events")
      .insert({
        conversation_id,
        tenant_id: conv.tenant_id,
        action: "ESCALATE",
        reason_code: "HANDOFF_REQUESTED",
      })

    if (!conv.escalated) {
      await db
        .from("public_helpdesk_conversations")
        .update({ escalated: true, last_activity_at: new Date().toISOString() })
        .eq("conversation_id", conversation_id)
    }

    return ok({ handoff_id: handoff.handoff_id }, 201)
  } catch (err) {
    return handleError(err)
  }
}
