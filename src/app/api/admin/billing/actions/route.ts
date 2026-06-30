import { NextRequest } from "next/server"
import { requireAuth, requireAdmin, getServiceClient } from "@/lib/auth"
import { ok, handleError, ValidationError } from "@/lib/api-helpers"
import { setActorContext } from "@/lib/utils/actor"
import { sendN8NNotification } from "@/lib/utils/notify"

type BillingAction = "mark_paid" | "mark_overdue" | "suspend" | "reactivate"
const VALID_ACTIONS: BillingAction[] = ["mark_paid", "mark_overdue", "suspend", "reactivate"]

function resolveUpdates(action: BillingAction): Record<string, string> {
  switch (action) {
    case "mark_paid":    return { billing_status: "paid" }
    case "mark_overdue": return { billing_status: "overdue" }
    case "suspend":      return { billing_status: "suspended", status: "suspended" }
    case "reactivate":   return { billing_status: "paid", status: "active" }
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireAuth()
    requireAdmin(ctx)
    const body = await req.json()
    const { tenant_id, action } = body as { tenant_id: string; action: BillingAction }
    if (!tenant_id || !action) throw new ValidationError("tenant_id and action are required")
    if (!VALID_ACTIONS.includes(action)) {
      throw new ValidationError("action must be one of: " + VALID_ACTIONS.join(", "))
    }
    const db = getServiceClient()
    await setActorContext(db, ctx.userId, ctx.role, req.headers.get("x-forwarded-for") ?? "")
    const updates = resolveUpdates(action)
    const { data, error } = await db
      .from("tenants")
      .update(updates)
      .eq("tenant_id", tenant_id)
      .select("tenant_id, company_name, status, billing_status")
      .single()
    if (error) throw error
    await sendN8NNotification({
      event: "billing_" + action,
      tenant_id,
      data: { ...updates, company_name: data?.company_name },
    })
    return ok(data)
  } catch (err) { return handleError(err) }
}
