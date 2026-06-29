import { NextRequest } from "next/server"
import { requireAuth, requireAdmin, getServiceClient } from "@/lib/auth"
import { ok, handleError } from "@/lib/api-helpers"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ctx = await requireAuth(); requireAdmin(ctx)
    const db = getServiceClient()
    const { data: tenant } = await db.from("tenants").select("tenant_id, company_name, billing_status, package_name").eq("tenant_id", params.id).single()
    const { data: limits } = await db.from("dashboard_package_limits").select("*").eq("package_name", tenant?.package_name).maybeSingle()
    return ok({ billing_status: tenant?.billing_status, package_name: tenant?.package_name, limits: limits ?? null })
  } catch (err) { return handleError(err) }
}
