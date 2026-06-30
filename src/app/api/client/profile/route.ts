import { NextRequest } from "next/server"
import { getServiceClient, requireAuth, requirePicOrOwner, resolveTenantId } from "@/lib/auth"
import { handleError, ok, ValidationError } from "@/lib/api-helpers"
import { setActorContext } from "@/lib/utils/actor"

export async function GET() {
  try {
    const ctx = await requireAuth()
    requirePicOrOwner(ctx)
    const tenantId = resolveTenantId(ctx)
    const db = getServiceClient()

    const [{ data: profile, error: profileError }, { data: tenant, error: tenantError }] = await Promise.all([
      db.from("dashboard_users").select("user_id, tenant_id, role, display_name, phone_number").eq("user_id", ctx.userId).maybeSingle(),
      db.from("tenants").select("tenant_id, company_name").eq("tenant_id", tenantId).single(),
    ])
    if (profileError) throw profileError
    if (tenantError) throw tenantError

    return ok({
      email: ctx.email,
      role: profile?.role ?? ctx.role,
      tenant_id: tenantId,
      company_name: tenant.company_name,
      display_name: profile?.display_name ?? ctx.email.split("@")[0],
      phone_number: profile?.phone_number ?? null,
    })
  } catch (err) {
    return handleError(err)
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const ctx = await requireAuth()
    requirePicOrOwner(ctx)
    const tenantId = resolveTenantId(ctx)
    const body = await req.json()
    const { display_name } = body
    if (!display_name || typeof display_name !== "string") throw new ValidationError("display_name is required")
    const db = getServiceClient()
    await setActorContext(db, ctx.userId, ctx.role, req.headers.get("x-forwarded-for") ?? "")

    const { data: existing, error: existingError } = await db
      .from("dashboard_users")
      .select("id")
      .eq("user_id", ctx.userId)
      .maybeSingle()
    if (existingError) throw existingError

    if (existing) {
      const { data, error } = await db
        .from("dashboard_users")
        .update({ display_name })
        .eq("user_id", ctx.userId)
        .select("user_id, tenant_id, role, display_name, phone_number")
        .single()
      if (error) throw error
      return ok(data)
    }

    const { data, error } = await db
      .from("dashboard_users")
      .insert({ user_id: ctx.userId, tenant_id: tenantId, role: ctx.role, display_name })
      .select("user_id, tenant_id, role, display_name, phone_number")
      .single()
    if (error) throw error
    return ok(data)
  } catch (err) {
    return handleError(err)
  }
}
