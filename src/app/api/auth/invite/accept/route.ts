import { NextRequest, NextResponse } from "next/server"
import { getServiceClient } from "@/lib/auth"
import { ValidationError, handleError, ok } from "@/lib/api-helpers"

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const token = typeof body.token === "string" ? body.token.trim() : ""
    const displayName = typeof body.display_name === "string" ? body.display_name.trim() : ""
    const password = typeof body.password === "string" ? body.password : ""

    if (!UUID_RE.test(token)) {
      return NextResponse.json({ ok: false, error: { code: "INVITE_EXPIRED" } }, { status: 410 })
    }
    if (!displayName) throw new ValidationError("display_name is required")
    if (!password) throw new ValidationError("password is required")

    const db = getServiceClient()
    const now = new Date().toISOString()
    const { data: invite, error: inviteError } = await db
      .from("invite_tokens")
      .select("tenant_id, role, email")
      .eq("token", token)
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
      password,
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

    const { error: updateError } = await db.from("invite_tokens").update({ used: true }).eq("token", token)
    if (updateError) throw updateError

    return ok({ redirectTo: "/client" })
  } catch (err) {
    return handleError(err)
  }
}
