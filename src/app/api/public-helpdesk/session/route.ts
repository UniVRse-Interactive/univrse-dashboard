import { NextRequest, NextResponse } from "next/server"
import { getServiceClient } from "@/lib/auth"
import { handleError, ok, ValidationError } from "@/lib/api-helpers"

function originAllowed(origin: string | null, allowed: unknown): boolean {
  if (!origin) return false
  if (!Array.isArray(allowed)) return false
  return (allowed as string[]).includes(origin)
}

export async function POST(req: NextRequest) {
  try {
    const origin = req.headers.get("origin")
    const body = await req.json()
    const widget_token = typeof body.widget_token === "string" ? body.widget_token.trim() : ""

    if (!widget_token) throw new ValidationError("widget_token is required")

    const db = getServiceClient()
    const { data: widget, error: widgetError } = await db
      .from("public_widget_identities")
      .select("widget_id, config_id, tenant_id, allowed_origins, status")
      .eq("widget_token", widget_token)
      .maybeSingle()
    if (widgetError) throw widgetError
    if (!widget || widget.status !== "active") {
      return NextResponse.json({ ok: false, error: { code: "WIDGET_NOT_FOUND" } }, { status: 404 })
    }
    if (!originAllowed(origin, widget.allowed_origins)) {
      return NextResponse.json({ ok: false, error: { code: "ORIGIN_NOT_ALLOWED" } }, { status: 403 })
    }

    const { data: config, error: configError } = await db
      .from("tenant_public_helpdesk_config")
      .select("config_id, greeting_message, rate_limit_session, status")
      .eq("config_id", widget.config_id)
      .maybeSingle()
    if (configError) throw configError
    if (!config || config.status !== "active") {
      return NextResponse.json({ ok: false, error: { code: "HELPDESK_NOT_ACTIVE" } }, { status: 503 })
    }

    const { data: conv, error: convError } = await db
      .from("public_helpdesk_conversations")
      .insert({
        widget_id: widget.widget_id,
        tenant_id: widget.tenant_id,
        visitor_origin: origin,
      })
      .select("conversation_id")
      .single()
    if (convError) throw convError

    return ok({ conversation_id: conv.conversation_id, greeting: config.greeting_message }, 201)
  } catch (err) {
    return handleError(err)
  }
}
