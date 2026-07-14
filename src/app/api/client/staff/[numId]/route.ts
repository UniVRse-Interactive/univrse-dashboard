import { NextRequest } from "next/server"
import { getServiceClient, requireAuth, requirePicOrOwner, resolveTenantId } from "@/lib/auth"
import { handleError, ok, ValidationError } from "@/lib/api-helpers"
import { setActorContext } from "@/lib/utils/actor"

export async function PATCH(req: NextRequest, { params }: { params: { numId: string } }) {
  try {
    const ctx = await requireAuth()
    requirePicOrOwner(ctx)
    const tenantId = resolveTenantId(ctx)
    const body = await req.json()
    const db = getServiceClient()

    const { data: numberRow, error: lookupError } = await db
      .from("tenant_numbers")
      .select("id, tenant_id, role, phone_number")
      .eq("id", params.numId)
      .eq("tenant_id", tenantId)
      .maybeSingle()
    if (lookupError) throw lookupError
    if (!numberRow) throw new ValidationError("Staff number not found")
    if (numberRow.role === "pic") throw new ValidationError("Cannot edit the pic number via this endpoint")

    const updates: Record<string, unknown> = {}
    if (typeof body.name === "string") updates.name = body.name.trim() || null

    if (Object.keys(updates).length === 0) throw new ValidationError("No valid fields to update")

    await setActorContext(db, ctx.userId, ctx.role, req.headers.get("x-forwarded-for") ?? "")
    const { data, error } = await db
      .from("tenant_numbers")
      .update(updates)
      .eq("id", params.numId)
      .eq("tenant_id", tenantId)
      .select("*")
      .single()
    if (error) throw error

    // Sync display_name to persons via channel_identities if name changed
    if (typeof updates.name === "string" && updates.name) {
      const { data: identity } = await db
        .from("channel_identities")
        .select("person_id")
        .eq("channel_user_id", numberRow.phone_number)
        .eq("tenant_id", tenantId)
        .eq("channel", "whatsapp")
        .maybeSingle()
      if (identity?.person_id) {
        await db
          .from("persons")
          .update({ display_name: updates.name as string })
          .eq("person_id", identity.person_id)
      }
    }

    return ok(data)
  } catch (err) {
    return handleError(err)
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { numId: string } }) {
  try {
    const ctx = await requireAuth()
    requirePicOrOwner(ctx)
    const tenantId = resolveTenantId(ctx)
    const db = getServiceClient()

    const { data: numberRow, error: lookupError } = await db
      .from("tenant_numbers")
      .select("id, tenant_id, role, phone_number")
      .eq("id", params.numId)
      .eq("tenant_id", tenantId)
      .maybeSingle()
    if (lookupError) throw lookupError
    if (!numberRow) throw new ValidationError("Staff number not found")
    if (numberRow.role === "pic") throw new ValidationError("Cannot remove the pic number")

    await setActorContext(db, ctx.userId, ctx.role, req.headers.get("x-forwarded-for") ?? "")
    const { data, error } = await db
      .from("tenant_numbers")
      .update({ authorized: false })
      .eq("id", params.numId)
      .eq("tenant_id", tenantId)
      .select("*")
      .single()
    if (error) throw error

    // Revoke bridge identity so the number can no longer reach Hani
    await db
      .from("channel_identities")
      .update({ authorized: false })
      .eq("channel_user_id", numberRow.phone_number)
      .eq("tenant_id", tenantId)
      .eq("channel", "whatsapp")

    return ok(data)
  } catch (err) {
    return handleError(err)
  }
}
