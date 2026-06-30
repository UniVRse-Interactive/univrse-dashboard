import { NextRequest } from "next/server"
import { requireAuth, requireAdmin, getServiceClient } from "@/lib/auth"
import { okList, ok, handleError, ValidationError } from "@/lib/api-helpers"

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireAuth(); requireAdmin(ctx)
    const db = getServiceClient()
    const { data, error, count } = await db
      .from("invite_tokens")
      .select("*", { count: "exact" })
      .eq("revoked", false)
      .eq("used", false)
      .order("created_at", { ascending: false })
    if (error) throw error
    return okList(data ?? [], count ?? 0)
  } catch (err) { return handleError(err) }
}

export async function DELETE(req: NextRequest) {
  try {
    const ctx = await requireAuth(); requireAdmin(ctx)
    const url = new URL(req.url)
    const inviteId = url.searchParams.get("id")
    if (!inviteId) throw new ValidationError("id required")
    const db = getServiceClient()
    const { error } = await db.from("invite_tokens").update({ revoked: true, revoked_by: ctx.userId, revoked_at: new Date().toISOString() }).eq("id", inviteId)
    if (error) throw error
    return ok({ revoked: true })
  } catch (err) { return handleError(err) }
}
