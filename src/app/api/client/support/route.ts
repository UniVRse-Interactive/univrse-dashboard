import { NextRequest } from "next/server"
import { getServiceClient, requireAuth, requirePicOrOwner, resolveTenantId } from "@/lib/auth"
import { handleError, ok, okList, ValidationError } from "@/lib/api-helpers"
import { sendN8NNotification } from "@/lib/utils/notify"
import { setActorContext } from "@/lib/utils/actor"
import { validatePhoneNumber } from "@/lib/validation"

export async function GET() {
  try {
    const ctx = await requireAuth()
    requirePicOrOwner(ctx)
    const tenantId = resolveTenantId(ctx)
    const db = getServiceClient()
    const { data, error, count } = await db
      .from("support_requests")
      .select("*", { count: "exact" })
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(20)
    if (error) throw error
    return okList(data ?? [], count ?? 0)
  } catch (err) {
    return handleError(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireAuth()
    requirePicOrOwner(ctx)
    const tenantId = resolveTenantId(ctx)
    const body = await req.json()
    const { subject, message, contact_phone, category, priority } = body
    if (!subject || !message) throw new ValidationError("subject and message are required")
    const db = getServiceClient()
    await setActorContext(db, ctx.userId, ctx.role, req.headers.get("x-forwarded-for") ?? "")
    const { data, error } = await db
      .from("support_requests")
      .insert({
        tenant_id: tenantId,
        user_id: ctx.userId,
        subject,
        message,
        contact_phone: contact_phone ? validatePhoneNumber(contact_phone) : null,
        category: category ?? "general",
        priority: priority ?? "normal",
      })
      .select("*")
      .single()
    if (error) throw error
    await sendN8NNotification({
      event: "support_request_created",
      tenant_id: tenantId,
      data: { subject, request_id: data.id },
    })
    return ok(data, 201)
  } catch (err) {
    return handleError(err)
  }
}
