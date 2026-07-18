import { NextRequest, NextResponse } from "next/server"
import { getServiceClient } from "@/lib/auth"
import { handleError, ok, ValidationError } from "@/lib/api-helpers"

function originAllowed(origin: string | null, allowed: unknown): boolean {
  if (!origin) return false
  if (!Array.isArray(allowed)) return false
  return (allowed as string[]).includes(origin)
}

export async function GET(req: NextRequest) {
  try {
    const origin = req.headers.get("origin")
    const { searchParams } = new URL(req.url)
    const widget_token = searchParams.get("widget_token")?.trim() ?? ""

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
      .select("persona_name, greeting_message, rate_limit_session, status")
      .eq("config_id", widget.config_id)
      .maybeSingle()
    if (configError) throw configError
    if (!config || config.status !== "active") {
      return NextResponse.json({ ok: false, error: { code: "HELPDESK_NOT_ACTIVE" } }, { status: 503 })
    }

    return ok({
      persona_name: config.persona_name,
      greeting_message: config.greeting_message,
      rate_limit_session: config.rate_limit_session,
    })
  } catch (err) {
    return handleError(err)
  }
}
