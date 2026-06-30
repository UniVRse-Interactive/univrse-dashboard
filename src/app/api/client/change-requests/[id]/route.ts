import { getServiceClient, requireAuth, requirePicOrOwner, requireTenantScope } from "@/lib/auth"
import { handleError, ok, ValidationError } from "@/lib/api-helpers"

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const ctx = await requireAuth()
    requirePicOrOwner(ctx)
    const db = getServiceClient()
    const { data, error } = await db.from("agent_change_requests").select("*").eq("id", params.id).maybeSingle()
    if (error) throw error
    if (!data) throw new ValidationError("Change request not found")
    requireTenantScope(ctx, data.tenant_id)
    return ok(data)
  } catch (err) {
    return handleError(err)
  }
}
