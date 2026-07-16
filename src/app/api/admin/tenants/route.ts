import { NextRequest, NextResponse } from "next/server"
import { requireAuth, requireAdmin, getServiceClient, AuthError } from "@/lib/auth"
import { okList, ok, handleError, ValidationError } from "@/lib/api-helpers"
import { setActorContext } from "@/lib/utils/actor"

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireAuth(); requireAdmin(ctx)
    const db = getServiceClient()
    const { data, error, count } = await db
      .from("tenants")
      .select("tenant_id, company_name, status, billing_status, package, created_at", { count: "exact" })
      .order("created_at", { ascending: false })
    if (error) throw error
    return okList(data ?? [], count ?? 0)
  } catch (err) { return handleError(err) }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireAuth(); requireAdmin(ctx)
    const body = await req.json()
    const { company_name, package_name } = body
    if (!company_name || !package_name) throw new ValidationError("company_name and package_name are required")
    const db = getServiceClient()
    await setActorContext(db, ctx.userId, ctx.role, req.headers.get("x-forwarded-for") ?? "")
    const { data, error } = await db
      .from("tenants")
      .insert({ company_name, package_name, status: "trial", billing_status: "paid" })
      .select("tenant_id, company_name, status, package_name")
      .single()
    if (error) throw error
    return ok(data, 201)
  } catch (err) { return handleError(err) }
}
