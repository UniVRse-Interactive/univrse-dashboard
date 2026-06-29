import { NextRequest } from "next/server"
import { requireAuth, requireAdmin, getServiceClient } from "@/lib/auth"
import { ok, handleError, ValidationError } from "@/lib/api-helpers"
import { setActorContext } from "@/lib/utils/actor"

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireAuth(); requireAdmin(ctx)
    const body = await req.json()
    const { tenant_id, role, phone_number, email } = body
    if (!tenant_id || !role || !phone_number) throw new ValidationError("tenant_id, role, phone_number required")
    const db = getServiceClient()
    await setActorContext(db, ctx.userId, ctx.role, req.headers.get("x-forwarded-for") ?? "")
    const token = crypto.randomUUID()
    const expires = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
    const { data, error } = await db.from("invite_tokens").insert({
      tenant_id, invited_dashboard_role: role, phone_number, email: email ?? null,
      token_hash: token, expires_at: expires, created_by_dashboard_user_id: ctx.userId,
    }).select("*").single()
    if (error) throw error
    console.log("[N8N-LEAF MOCK] WhatsApp invite token:", token, "to:", phone_number)
    return ok(data, 201)
  } catch (err) { return handleError(err) }
}
