import { NextRequest, NextResponse } from "next/server"
import { getServiceClient } from "@/lib/auth"
import { handleError, ok, ValidationError } from "@/lib/api-helpers"
import { sendN8NNotification } from "@/lib/utils/notify"
import { validatePhoneNumber } from "@/lib/validation"

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const tenantId = typeof body?.tenant_id === "string" ? body.tenant_id.trim() : ""
    const name = typeof body?.name === "string" ? body.name.trim() : ""
    const phone = validatePhoneNumber(typeof body?.phone === "string" ? body.phone : "")
    const message = typeof body?.message === "string" ? body.message.trim() : ""

    if (!UUID_RE.test(tenantId)) throw new ValidationError("tenant_id must be a valid UUID")
    if (!name) throw new ValidationError("name is required")
    if (!message) throw new ValidationError("message is required")

    const db = getServiceClient()
    const { data: tenant, error: tenantError } = await db.from("tenants").select("tenant_id, status").eq("tenant_id", tenantId).maybeSingle()
    if (tenantError) throw tenantError
    if (!tenant || tenant.status === "suspended") {
      return NextResponse.json({ ok: false, error: { code: "TENANT_NOT_FOUND" } }, { status: 404 })
    }

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const rateCheck = await db
      .from("support_requests")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("contact_phone", phone)
      .gte("created_at", oneHourAgo)
    if (rateCheck.error) throw rateCheck.error
    if ((rateCheck.count ?? 0) >= 3) throw new ValidationError("Too many requests from this phone in the last hour")

    const subject = `Helpdesk Widget: ${name}`
    const { data, error } = await db
      .from("support_requests")
      .insert({
        tenant_id: tenantId,
        subject,
        message,
        contact_phone: phone,
        status: "open",
      })
      .select("*")
      .single()
    if (error) throw error

    await sendN8NNotification({
      event: "support_request_created",
      tenant_id: tenantId,
      data: { subject, request_id: data.id, name, phone, source: "helpdesk_widget" },
    })

    return ok(data, 201)
  } catch (err) {
    return handleError(err)
  }
}
