import { NextRequest, NextResponse } from "next/server"
import { getServiceClient } from "@/lib/auth"
import { handleError, ok, ValidationError } from "@/lib/api-helpers"

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const MAX_CONTENT_LENGTH = 2000

// Phase 0: stub response — no RAG or brain calls.
// Replace with real pipeline in Phase 1 when HELPDESK_AI_ENABLED env var is set.
const PHASE0_STUB_REPLY =
  "Thank you for your message. Our AI assistant is being set up. A member of our team will follow up with you shortly."

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
    const content = typeof body.content === "string" ? body.content.trim() : ""

    if (!UUID_RE.test(conversation_id)) throw new ValidationError("conversation_id must be a valid UUID")
    if (!content) throw new ValidationError("content is required")
    if (content.length > MAX_CONTENT_LENGTH) throw new ValidationError("content too long")

    const db = getServiceClient()
    const { data: conv, error: convError } = await db
      .from("public_helpdesk_conversations")
      .select("conversation_id, widget_id, tenant_id, message_count")
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

    const { data: config, error: configError } = await db
      .from("tenant_public_helpdesk_config")
      .select("rate_limit_session, status")
      .eq("config_id", widget.config_id)
      .maybeSingle()
    if (configError) throw configError
    if (!config || config.status !== "active") {
      return NextResponse.json({ ok: false, error: { code: "HELPDESK_NOT_ACTIVE" } }, { status: 503 })
    }

    if (conv.message_count >= config.rate_limit_session) {
      return NextResponse.json({ ok: false, error: { code: "SESSION_LIMIT_REACHED" } }, { status: 429 })
    }

    const { data: userMsg, error: userMsgError } = await db
      .from("public_helpdesk_messages")
      .insert({ conversation_id, tenant_id: conv.tenant_id, role: "user", content, action: "ALLOW" })
      .select("message_id")
      .single()
    if (userMsgError) throw userMsgError

    const reply = PHASE0_STUB_REPLY
    const { data: assistantMsg, error: assistantMsgError } = await db
      .from("public_helpdesk_messages")
      .insert({ conversation_id, tenant_id: conv.tenant_id, role: "assistant", content: reply, action: "ALLOW" })
      .select("message_id")
      .single()
    if (assistantMsgError) throw assistantMsgError

    await db
      .from("public_helpdesk_conversations")
      .update({ message_count: conv.message_count + 2, last_activity_at: new Date().toISOString() })
      .eq("conversation_id", conversation_id)

    return ok({
      message_id: userMsg.message_id,
      reply,
      action: "ALLOW" as const,
      reply_message_id: assistantMsg.message_id,
    })
  } catch (err) {
    return handleError(err)
  }
}
