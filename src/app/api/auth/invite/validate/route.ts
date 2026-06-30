import { NextRequest, NextResponse } from "next/server"
import { getServiceClient } from "@/lib/auth"
import { ok } from "@/lib/api-helpers"

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token")?.trim() ?? ""
  if (!UUID_RE.test(token)) {
    return NextResponse.json(
      { ok: true, data: { tenant_name: null, role: null, expires_at: null, valid: false } },
      { status: 410 }
    )
  }

  try {
    const db = getServiceClient()
    const now = new Date().toISOString()
    const { data: invite, error } = await db
      .from("invite_tokens")
      .select("tenant_id, role, expires_at")
      .eq("token", token)
      .eq("used", false)
      .eq("revoked", false)
      .gt("expires_at", now)
      .maybeSingle()

    if (error) {
      throw error
    }

    if (!invite) {
      return NextResponse.json(
        { ok: true, data: { tenant_name: null, role: null, expires_at: null, valid: false } },
        { status: 410 }
      )
    }

    const { data: tenant, error: tenantError } = await db
      .from("tenants")
      .select("company_name")
      .eq("tenant_id", invite.tenant_id)
      .maybeSingle()

    if (tenantError) {
      throw tenantError
    }

    return ok({
      tenant_name: tenant?.company_name ?? null,
      role: invite.role,
      expires_at: invite.expires_at,
      valid: true,
    })
  } catch (error) {
    console.error("[invite.validate]", error)
    return NextResponse.json({ ok: false, error: { code: "INTERNAL_ERROR" } }, { status: 500 })
  }
}
