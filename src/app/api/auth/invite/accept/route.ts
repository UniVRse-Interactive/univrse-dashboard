import { NextRequest, NextResponse } from "next/server"
import { getServiceClient } from "@/lib/auth"
import { ValidationError, handleError, ok } from "@/lib/api-helpers"

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function POST(req: NextRequest) {
  try {
    const { token, display_name, password } = await req.json()
    if (!token || !display_name || !password) {
      return handleError(new ValidationError("token, display_name, and password are required"))
    }

    const normalizedToken = typeof token === "string" ? token.trim() : ""
    const displayName = typeof display_name === "string" ? display_name.trim() : ""
    const normalizedPassword = typeof password === "string" ? password : ""

    if (!UUID_RE.test(normalizedToken)) {
      return NextResponse.json({ ok: false, error: { code: "INVITE_EXPIRED" } }, { status: 410 })
    }
    if (!displayName) throw new ValidationError("display_name is required")
    if (!normalizedPassword) throw new ValidationError("password is required")

    const db = getServiceClient()
    const now = new Date().toISOString()
    const { data: invite, error: inviteError } = await db
      .from("invite_tokens")
      .select("tenant_id, role, email")
      .eq("token", normalizedToken)
      .eq("used", false)
      .eq("revoked", false)
      .gt("expires_at", now)
      .maybeSingle()

    if (inviteError) throw inviteError

    if (!invite) {
      return NextResponse.json({ ok: false, error: { code: "INVITE_EXPIRED" } }, { status: 410 })
    }
    if (!invite.email) {
      return NextResponse.json({ ok: false, error: { code: "INVITE_EMAIL_MISSING" } }, { status: 500 })
    }

    const createRes = await db.auth.admin.createUser({
      email: invite.email,
      password: normalizedPassword,
      email_confirm: true,
      user_metadata: { display_name: displayName },
    })

    if (createRes.error || !createRes.data.user) {
      console.error("[invite.accept.createUser]", createRes.error?.message ?? "missing user")
      return NextResponse.json({ ok: false, error: { code: "USER_CREATE_FAILED" } }, { status: 500 })
    }

    const authUser = createRes.data.user
    const { error: dashboardUserError } = await db.from("dashboard_users").insert({
      user_id: authUser.id,
      tenant_id: invite.tenant_id,
      role: invite.role,
      display_name: displayName,
    })

    if (dashboardUserError) {
      await db.auth.admin.deleteUser(authUser.id)
      console.error("[invite.accept.dashboard_users]", dashboardUserError.message)
      return NextResponse.json({ ok: false, error: { code: "DASHBOARD_USER_INSERT_FAILED" } }, { status: 500 })
    }

    const { error: updateError } = await db.from("invite_tokens").update({ used: true }).eq("token", normalizedToken)
    if (updateError) throw updateError

    return ok({ redirectTo: "/client" })
  } catch (err) {
    return handleError(err)
  }
}
