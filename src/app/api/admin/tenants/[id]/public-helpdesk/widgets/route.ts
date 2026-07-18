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
      .from("public_widget_identities")
      .select("*")
      .eq("tenant_id", params.id)
      .order("created_at", { ascending: false })
    if (error) throw error

    return ok(data ?? [])
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
    const config_id = typeof body.config_id === "string" ? body.config_id.trim() : ""
    const allowed_origins: unknown = Array.isArray(body.allowed_origins) ? body.allowed_origins : []
    const display_label = typeof body.display_label === "string" ? body.display_label.trim() : null
    const status = typeof body.status === "string" ? body.status.trim() : "setup"

    if (!UUID_RE.test(config_id)) throw new ValidationError("config_id must be a valid UUID")
    if (!(VALID_STATUS as readonly string[]).includes(status)) throw new ValidationError("Invalid status")

    const originList = allowed_origins as unknown[]
    if (!originList.every((o) => typeof o === "string" && o.startsWith("https://"))) {
      throw new ValidationError("allowed_origins must be an array of https:// URLs")
    }

    const db = getServiceClient()
    const { data: config, error: configError } = await db
      .from("tenant_public_helpdesk_config")
      .select("config_id, tenant_id")
      .eq("config_id", config_id)
      .eq("tenant_id", params.id)
      .maybeSingle()
    if (configError) throw configError
    if (!config) throw new ValidationError("Config not found for this tenant")

    const { data, error } = await db
      .from("public_widget_identities")
      .insert({ config_id, tenant_id: params.id, allowed_origins, display_label, status })
      .select("*")
      .single()
    if (error) throw error

    return ok(data, 201)
  } catch (err) {
    return handleError(err)
  }
}
