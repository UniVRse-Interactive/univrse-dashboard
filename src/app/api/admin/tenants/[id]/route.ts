import { NextRequest } from "next/server"
import { requireAuth, requireAdmin, getServiceClient } from "@/lib/auth"
import { ok, handleError, ValidationError } from "@/lib/api-helpers"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ctx = await requireAuth(); requireAdmin(ctx)
    const db = getServiceClient()
    const { data, error } = await db.from("tenants").select("*").eq("tenant_id", params.id).single()
    if (error) throw error
    return ok(data)
  } catch (err) { return handleError(err) }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ctx = await requireAuth(); requireAdmin(ctx)
    const body = await req.json()
    const { status, billing_status, package_name, quota_monthly } = body
    const updates: Record<string, unknown> = {}
    if (status) updates.status = status
    if (billing_status) updates.billing_status = billing_status
    if (package_name) updates.package_name = package_name
    if (typeof quota_monthly === "number") updates.quota_monthly = quota_monthly
    if (Object.keys(updates).length === 0) throw new ValidationError("No valid fields to update")
    const db = getServiceClient()
    const { data, error } = await db.from("tenants").update(updates).eq("tenant_id", params.id).select("*").single()
    if (error) throw error
    return ok(data)
  } catch (err) { return handleError(err) }
}
