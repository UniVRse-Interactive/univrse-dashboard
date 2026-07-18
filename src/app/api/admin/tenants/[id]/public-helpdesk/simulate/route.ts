import { NextRequest, NextResponse } from "next/server"
import { requireAdmin, requireAuth } from "@/lib/auth"
import { handleError, ValidationError } from "@/lib/api-helpers"

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Phase 1A: stub guarded by HELPDESK_AI_ENABLED.
// Production keeps this flag unset → always 503.
// Local dev: set HELPDESK_AI_ENABLED=true in .env.local to enable.
// Phase 1A retrieval simulation runs via tools/public_kb_simulate.py on VPS.
// Phase 1B: wire KB embed + LLM guardrail + S1-S10 scorecard here.
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ctx = await requireAuth()
    requireAdmin(ctx)

    if (!process.env.HELPDESK_AI_ENABLED) {
      return NextResponse.json(
        { ok: false, error: { code: "SIMULATION_NOT_ENABLED" } },
        { status: 503 }
      )
    }

    if (!UUID_RE.test(params.id)) throw new ValidationError("Invalid tenant id")

    return NextResponse.json(
      { ok: false, error: { code: "NOT_IMPLEMENTED", detail: "Phase 1B" } },
      { status: 501 }
    )
  } catch (err) {
    return handleError(err)
  }
}
