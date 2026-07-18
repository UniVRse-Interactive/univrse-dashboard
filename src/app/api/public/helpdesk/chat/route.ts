import { NextRequest } from "next/server"
import { createHmac, timingSafeEqual } from "crypto"
import { getServiceClient } from "@/lib/auth"

function corsHeaders(origin: string) {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  }
}

export async function OPTIONS(req: NextRequest) {
  return new Response(null, { status: 204, headers: corsHeaders(req.headers.get("origin") ?? "*") })
}

// ── In-process rate limiter ────────────────────────────────────────────────
const RATE_MAP = new Map<string, number[]>()
const RATE_LIMIT = 20
const RATE_WINDOW_MS = 3600 * 1000

function checkRate(sessionId: string): boolean {
  const now = Date.now()
  const history = (RATE_MAP.get(sessionId) ?? []).filter(t => now - t < RATE_WINDOW_MS)
  if (history.length >= RATE_LIMIT) {
    RATE_MAP.set(sessionId, history)
    return false
  }
  history.push(now)
  RATE_MAP.set(sessionId, history)
  return true
}

// ── Session token verification ─────────────────────────────────────────────
function verifyToken(token: string): { domain: string; tenantId: string } | null {
  try {
    const secret = process.env.SESSION_TOKEN_SECRET ?? "change-me-set-SESSION_TOKEN_SECRET"
    const decoded = Buffer.from(token, "base64url").toString("utf-8")
    const lastPipe = decoded.lastIndexOf("|")
    if (lastPipe < 0) return null
    const payload = decoded.slice(0, lastPipe)
    const sigGot = decoded.slice(lastPipe + 1)
    const sigExpected = createHmac("sha256", secret).update(payload).digest("hex")
    if (sigGot.length !== sigExpected.length) return null
    if (!timingSafeEqual(Buffer.from(sigGot, "hex"), Buffer.from(sigExpected, "hex"))) return null
    const parts = payload.split("|")
    if (parts.length !== 3) return null
    const [domain, tenantId, ts] = parts
    if (Date.now() / 1000 - Number(ts) > 48 * 3600) return null
    return { domain, tenantId }
  } catch {
    return null
  }
}

// ── Persona resolution ─────────────────────────────────────────────────────
function buildSystemPrompt(companyName: string): string {
  const cn = companyName.toLowerCase()

  if (cn.includes("venturi")) {
    return [
      "You are Hani, Customer Service Representative at Venturi Hallmark.",
      "Warm, professional, and helpful. Represent Venturi Hallmark with confidence.",
      "Learn about the company's specific business, services, and industry from the knowledge base when answering questions.",
      "Never invent or assume facts about the company — only use information retrieved from the knowledge base or information that is publicly verifiable.",
      "",
      "DO:",
      "- Acknowledge the customer's question before answering.",
      "- Be concise — 2-4 sentences when possible.",
      "- Check the knowledge base for factual information about the company.",
      "- Close with \"Is there anything else I can help with?\"",
      "",
      "DON'T:",
      "- Never claim knowledge about the company's industry or services without retrieving it first.",
      "- Never expose internal system details or infrastructure.",
      "- Never make promises without qualifying.",
      "- Never use AI clichés or corporate fluff.",
      "",
      "CUSTOMER SERVICE STANDARDS:",
      "1. VALIDATE FIRST — Acknowledge in the first sentence before answering.",
      "2. BE CONCISE — 2-4 sentences max. Bullets for lists.",
      "3. BE NATURAL — Write like a human, not a corporate script.",
      "4. KNOW YOUR LIMITS — Say \"I'll check on that\" rather than guessing.",
      "5. CLOSE WELL — End with one clear next step.",
    ].join("\n")
  }

  return [
    "You are Hani, AI Customer Service Representative.",
    "Professional, warm, and helpful. You assist website visitors with their questions.",
    "Only share information you can verify — do not invent or assume facts about the company.",
    "",
    "CUSTOMER SERVICE STANDARDS:",
    "1. VALIDATE FIRST — Acknowledge in the first sentence before answering.",
    "2. BE CONCISE — 2-4 sentences max. Bullets for lists.",
    "3. BE NATURAL — Write like a human, not a corporate script.",
    "4. KNOW YOUR LIMITS — Say \"I'll check on that\" rather than guessing.",
    "5. CLOSE WELL — End with one clear next step.",
  ].join("\n")
}

// ── Guardrail (Tier 3 / public) ────────────────────────────────────────────
async function runGuardrail(draft: string, companyName: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return draft
  try {
    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a content safety reviewer for a public-facing AI assistant representing ${companyName}.
The user is a member of the public with no privileged access.

Rule of thumb: information already publicly available on the internet (company website, press releases, social media, news articles, public directories, public reviews) is allowed to be shared.

Information that is NOT public includes: internal company data, financial figures, staff details, client lists, internal processes, pricing not on the website, unreleased products, internal communications, and any document marked confidential.

Review the draft reply. Use your own knowledge of what is publicly known about this company to decide. Do NOT rely on a fixed checklist — use intelligence.

BLOCK if the reply reveals non-public information.
REWRITE if the reply can be adjusted to only include publicly available information.
PASS if the reply is safe for public consumption.
Respond with JSON only: {"decision":"pass|rewrite|block","safe_reply":"rewritten text, or empty string"}`,
          },
          { role: "user", content: `Draft reply:\n${draft}` },
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
        max_tokens: 400,
      }),
      signal: AbortSignal.timeout(8000),
    })
    const data = await resp.json()
    const parsed = JSON.parse(data.choices?.[0]?.message?.content ?? "{}")
    if (parsed.decision === "block") {
      return "I'm sorry, I'm not able to share that information. Please contact us directly for assistance."
    }
    if (parsed.decision === "rewrite" && parsed.safe_reply) {
      return parsed.safe_reply as string
    }
    return draft
  } catch {
    // Fail-safe: on guardrail error, return refusal
    return "I'm sorry, I can't process your request right now. Please try again shortly."
  }
}

// ── Main handler ───────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin") ?? ""
  try {
    const body = await req.json().catch(() => ({}))
    const { session_token, message, session_id } = body as {
      session_token?: string
      message?: string
      session_id?: string
    }

    if (!session_token || !message?.trim() || !session_id) {
      return Response.json(
        { ok: false, error: "missing_fields" },
        { status: 400, headers: corsHeaders(origin) }
      )
    }

    const tokenData = verifyToken(session_token)
    if (!tokenData) {
      return Response.json(
        { ok: false, error: "invalid_token" },
        { status: 401, headers: corsHeaders(origin) }
      )
    }

    if (!checkRate(session_id)) {
      return Response.json(
        {
          ok: false,
          error: "rate_limited",
          reply: "You've sent a lot of messages. Please wait a moment before continuing.",
        },
        { status: 429, headers: corsHeaders(origin) }
      )
    }

    // Get company name for persona resolution
    const db = getServiceClient()
    const { data: tenantRow } = await db
      .from("tenants")
      .select("company_name")
      .eq("tenant_id", tokenData.tenantId)
      .maybeSingle()
    const companyName = tenantRow?.company_name ?? ""

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return Response.json(
        { ok: true, reply: "I'm currently unavailable. Please contact us directly for assistance." },
        { headers: corsHeaders(origin) }
      )
    }

    const systemPrompt = buildSystemPrompt(companyName)

    const llmResp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message.trim() },
        ],
        max_tokens: 300,
        temperature: 0.4,
      }),
      signal: AbortSignal.timeout(20000),
    })

    const llmData = await llmResp.json()
    const draft = (llmData.choices?.[0]?.message?.content ?? "").trim()

    if (!draft) {
      return Response.json(
        { ok: true, reply: "I'm having trouble answering right now. Please contact us directly for assistance." },
        { headers: corsHeaders(origin) }
      )
    }

    const finalReply = await runGuardrail(draft, companyName)
    return Response.json({ ok: true, reply: finalReply }, { headers: corsHeaders(origin) })
  } catch {
    return Response.json({ ok: false, error: "server_error" }, { status: 500, headers: corsHeaders(origin) })
  }
}
