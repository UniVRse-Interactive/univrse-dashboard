import { NextRequest } from "next/server"
import { requireAuth, requireAdmin, getServiceClient } from "@/lib/auth"
import { ok, handleError, ValidationError } from "@/lib/api-helpers"
import { sendN8NNotification } from "@/lib/utils/notify"
import { setActorContext } from "@/lib/utils/actor"

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireAuth(); requireAdmin(ctx)
    const body = await req.json()
    const { tenant_id, role, phone_number, email } = body
    if (!tenant_id || !role || !phone_number || !email) throw new ValidationError("tenant_id, role, phone_number, email required")
    const db = getServiceClient()
    await setActorContext(db, ctx.userId, ctx.role, req.headers.get("x-forwarded-for") ?? "")
    const token = crypto.randomUUID()
    const expires_at = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
    const { data, error } = await db.from("invite_tokens").insert({
      tenant_id,
      role,
      phone_number,
      email,
      token,
      expires_at,
      invited_by: ctx.userId,
    }).select("*").single()
    if (error) throw error
    await sendN8NNotification({
      event: "invite_created",
      tenant_id,
      data: { role, phone_number, expires_at },
    })
    console.log("[N8N-LEAF MOCK] WhatsApp invite token:", token, "to:", phone_number)
    return ok(data, 201)
  } catch (err) { return handleError(err) }
}
