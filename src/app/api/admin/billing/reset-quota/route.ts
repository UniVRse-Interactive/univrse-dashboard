import { NextRequest } from "next/server"
import { requireAuth, requireAdmin, getServiceClient } from "@/lib/auth"
import { ok, handleError, ValidationError } from "@/lib/api-helpers"
import { setActorContext } from "@/lib/utils/actor"
import { sendN8NNotification } from "@/lib/utils/notify"

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireAuth()
    requireAdmin(ctx)
    const body = await req.json()
    const { tenant_id, billing_period } = body as { tenant_id: string; billing_period?: string }
    if (!tenant_id) throw new ValidationError("tenant_id is required")
    const period = billing_period ?? new Date().toISOString().slice(0, 7)
    const db = getServiceClient()
    await setActorContext(db, ctx.userId, ctx.role, req.headers.get("x-forwarded-for") ?? "")
    const { data, error } = await db
      .from("tenant_usage")
      .upsert(
        {
          tenant_id,
          billing_period: period,
          query_count: 0,
          dev_hours_used: 0,
          workflow_executions: 0,
          last_updated: new Date().toISOString(),
        },
        { onConflict: "tenant_id,billing_period" }
      )
      .select()
      .single()
    if (error) throw error
    await sendN8NNotification({ event: "quota_reset", tenant_id, data: { billing_period: period } })
    return ok(data)
  } catch (err) { return handleError(err) }
}
