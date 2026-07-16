import { NextRequest } from "next/server"
import { createHmac } from "crypto"
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

function signToken(domain: string, tenantId: string): string {
  const secret = process.env.SESSION_TOKEN_SECRET ?? "change-me-set-SESSION_TOKEN_SECRET"
  const ts = Math.floor(Date.now() / 1000)
  const payload = `${domain}|${tenantId}|${ts}`
  const sig = createHmac("sha256", secret).update(payload).digest("hex")
  return Buffer.from(`${payload}|${sig}`).toString("base64url")
}

export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin") ?? ""
  try {
    const body = await req.json().catch(() => ({}))
    const domain = (body.domain ?? "").trim().toLowerCase()
    if (!domain) {
      return Response.json({ ok: false, error: "missing_domain" }, { status: 400, headers: corsHeaders(origin) })
    }

    const db = getServiceClient()
    const { data, error } = await db
      .from("helpdesk_domains")
      .select("tenant_id, agent_name, greeting, theme_color")
      .eq("domain", domain)
      .eq("active", true)
      .maybeSingle()

    if (error) throw error
    if (!data) {
      return Response.json({ ok: false, error: "domain_not_registered" }, { status: 404, headers: corsHeaders(origin) })
    }

    const sessionToken = signToken(domain, data.tenant_id)

    return Response.json(
      {
        ok: true,
        tenant_id: data.tenant_id,
        agent_name: data.agent_name,
        greeting: data.greeting,
        theme_color: data.theme_color,
        session_token: sessionToken,
      },
      { headers: corsHeaders(origin) }
    )
  } catch {
    return Response.json({ ok: false, error: "server_error" }, { status: 500, headers: corsHeaders(origin) })
  }
}
