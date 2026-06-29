import { NextRequest } from "next/server"
import { requireAuth, requireAdmin, getServiceClient } from "@/lib/auth"
import { okList, ok, handleError, ValidationError } from "@/lib/api-helpers"
import { setActorContext } from "@/lib/utils/actor"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ctx = await requireAuth(); requireAdmin(ctx)
    const db = getServiceClient()
    const { data, error, count } = await db.from("tenant_numbers").select("*", { count: "exact" }).eq("tenant_id", params.id)
    if (error) throw error
    return okList(data ?? [], count ?? 0)
  } catch (err) { return handleError(err) }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ctx = await requireAuth(); requireAdmin(ctx)
    const body = await req.json()
    const { phone_number, role } = body
    if (!phone_number || !role) throw new ValidationError("phone_number and role are required")
    const db = getServiceClient()
    await setActorContext(db, ctx.userId, ctx.role, req.headers.get("x-forwarded-for") ?? "")
    const { data, error } = await db.from("tenant_numbers").insert({ tenant_id: params.id, phone_number, role }).select("*").single()
    if (error) throw error
    return ok(data, 201)
  } catch (err) { return handleError(err) }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ctx = await requireAuth(); requireAdmin(ctx)
    const db = getServiceClient()
    const url = new URL(req.url)
    const numId = url.searchParams.get("number_id")
    if (!numId) throw new ValidationError("number_id query param required")
    await setActorContext(db, ctx.userId, ctx.role, req.headers.get("x-forwarded-for") ?? "")
    const { error } = await db.from("tenant_numbers").delete().eq("number_id", numId).eq("tenant_id", params.id)
    if (error) throw error
    return ok({ deleted: true })
  } catch (err) { return handleError(err) }
}
