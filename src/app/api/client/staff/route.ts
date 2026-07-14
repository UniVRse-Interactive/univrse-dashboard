import { NextRequest } from "next/server"
import { getServiceClient, requireAuth, requirePicOrOwner, resolveTenantId } from "@/lib/auth"
import { handleError, ok, okList, ValidationError } from "@/lib/api-helpers"
import { setActorContext } from "@/lib/utils/actor"
import { validatePhoneNumber } from "@/lib/validation"

export async function GET() {
  try {
    const ctx = await requireAuth()
    requirePicOrOwner(ctx)
    const tenantId = resolveTenantId(ctx)
    const db = getServiceClient()
    const { data, error, count } = await db
      .from("tenant_numbers")
      .select("*", { count: "exact" })
      .eq("tenant_id", tenantId)
      .eq("authorized", true)
      .order("created_at", { ascending: false })
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
    const phoneNumber = validatePhoneNumber(body.phone_number ?? "")
    const displayName: string = body.name?.trim() || phoneNumber
    const db = getServiceClient()

    const { data: tenant, error: tenantError } = await db
      .from("tenants")
      .select("tenant_id, package")
      .eq("tenant_id", tenantId)
      .single()
    if (tenantError) throw tenantError

    const { count: activeCount, error: countError } = await db
      .from("tenant_numbers")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("authorized", true)
    if (countError) throw countError

    const { data: limits, error: limitsError } = await db
      .from("dashboard_package_limits")
      .select("max_staff")
      .eq("package_name", tenant.package)
      .maybeSingle()
    if (limitsError) throw limitsError
    if (typeof limits?.max_staff === "number" && (activeCount ?? 0) >= limits.max_staff) {
      throw new ValidationError("Package staff limit reached")
    }

    await setActorContext(db, ctx.userId, ctx.role, req.headers.get("x-forwarded-for") ?? "")
    const { data, error } = await db
      .from("tenant_numbers")
      .insert({ tenant_id: tenantId, phone_number: phoneNumber, name: displayName, role: "member", authorized: true })
      .select("*")
      .single()
    if (error) throw error

    // Register in channel_identities so the bridge can resolve this number
    const { data: newPerson } = await db
      .from("persons")
      .insert({ display_name: displayName, locale: "en" })
      .select("person_id")
      .single()
    if (newPerson?.person_id) {
      await db.from("channel_identities").insert({
        person_id: newPerson.person_id,
        tenant_id: tenantId,
        channel: "whatsapp",
        channel_user_id: phoneNumber,
        role: "T2_STAFF",
        authorized: true,
        registered_by: "system",
      })
    }

    return ok(data, 201)
  } catch (err) {
    return handleError(err)
  }
}
