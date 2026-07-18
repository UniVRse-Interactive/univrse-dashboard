import { NextRequest } from "next/server"
import { getServiceClient, requireAdmin, requireAuth } from "@/lib/auth"
import { handleError, ok, ValidationError } from "@/lib/api-helpers"

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const VALID_STATUS = ["setup", "trial", "active", "disabled"] as const

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ctx = await requireAuth()
    requireAdmin(ctx)

    if (!UUID_RE.test(params.id)) throw new ValidationError("Invalid tenant id")

    const db = getServiceClient()
    const { data, error } = await db
      .from("tenant_public_helpdesk_config")
      .select("*")
      .eq("tenant_id", params.id)
      .maybeSingle()
    if (error) throw error

    return ok(data ?? null)
  } catch (err) {
    return handleError(err)
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ctx = await requireAuth()
    requireAdmin(ctx)

    if (!UUID_RE.test(params.id)) throw new ValidationError("Invalid tenant id")

    const body = await req.json()
    const persona_name = typeof body.persona_name === "string" ? body.persona_name.trim() : ""
    const public_kb_namespace = typeof body.public_kb_namespace === "string" ? body.public_kb_namespace.trim() : ""
    const greeting_message = typeof body.greeting_message === "string" ? body.greeting_message.trim() : ""
    const rate_limit_session = typeof body.rate_limit_session === "number" ? body.rate_limit_session : 60
    const status = typeof body.status === "string" ? body.status.trim() : "setup"

    if (!persona_name) throw new ValidationError("persona_name is required")
    if (!public_kb_namespace) throw new ValidationError("public_kb_namespace is required")
    if (!greeting_message) throw new ValidationError("greeting_message is required")
    if (!(VALID_STATUS as readonly string[]).includes(status)) throw new ValidationError("Invalid status")
    if (!Number.isInteger(rate_limit_session) || rate_limit_session < 1 || rate_limit_session > 500) {
      throw new ValidationError("rate_limit_session must be an integer 1–500")
    }

    const db = getServiceClient()
    const { data: tenant, error: tenantError } = await db
      .from("tenants")
      .select("tenant_id")
      .eq("tenant_id", params.id)
      .maybeSingle()
    if (tenantError) throw tenantError
    if (!tenant) throw new ValidationError("Tenant not found")

    const { data: existing } = await db
      .from("tenant_public_helpdesk_config")
      .select("config_id")
      .eq("tenant_id", params.id)
      .maybeSingle()

    const payload = { tenant_id: params.id, persona_name, public_kb_namespace, greeting_message, rate_limit_session, status }

    let data
    if (existing) {
      const result = await db
        .from("tenant_public_helpdesk_config")
        .update({ persona_name, public_kb_namespace, greeting_message, rate_limit_session, status })
        .eq("tenant_id", params.id)
        .select("*")
        .single()
      if (result.error) throw result.error
      data = result.data
    } else {
      const result = await db
        .from("tenant_public_helpdesk_config")
        .insert(payload)
        .select("*")
        .single()
      if (result.error) throw result.error
      data = result.data
    }

    return ok(data, existing ? 200 : 201)
  } catch (err) {
    return handleError(err)
  }
}
