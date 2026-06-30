import { NextRequest } from "next/server"
import { getServiceClient, requireAuth, requirePicOrOwner, resolveTenantId } from "@/lib/auth"
import { handleError, ok, ValidationError } from "@/lib/api-helpers"
import { setActorContext } from "@/lib/utils/actor"

export async function DELETE(req: NextRequest, { params }: { params: { numId: string } }) {
  try {
    const ctx = await requireAuth()
    requirePicOrOwner(ctx)
    const tenantId = resolveTenantId(ctx)
    const db = getServiceClient()

    const { data: numberRow, error: lookupError } = await db
      .from("tenant_numbers")
      .select("id, tenant_id, role, authorized")
      .eq("id", params.numId)
      .eq("tenant_id", tenantId)
      .maybeSingle()
    if (lookupError) throw lookupError
    if (!numberRow) throw new ValidationError("Staff number not found")
    if (numberRow.role === "owner") throw new ValidationError("PIC cannot remove owner numbers")

    await setActorContext(db, ctx.userId, ctx.role, req.headers.get("x-forwarded-for") ?? "")
    const { data, error } = await db
      .from("tenant_numbers")
      .update({ authorized: false })
      .eq("id", params.numId)
      .eq("tenant_id", tenantId)
      .select("*")
      .single()
    if (error) throw error
    return ok(data)
  } catch (err) {
    return handleError(err)
  }
}
