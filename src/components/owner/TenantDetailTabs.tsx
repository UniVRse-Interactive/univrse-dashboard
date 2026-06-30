"use client"

import { useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function TenantDetailTabs({ tenant, agent, usage, billing }: { tenant: any; agent: any; usage: any; billing: any }) {
  const [tab, setTab] = useState<"overview" | "helpdesk">("overview")
  const snippet = useMemo(
    () => `<script src="https://dashboard.univrse.io/widget/helpdesk.js"\n  data-tenant="${tenant.tenant_id}"\n  data-label="Chat with us"\n  data-color="#7c3aed"></script>`,
    [tenant.tenant_id]
  )

  async function copySnippet() {
    await navigator.clipboard.writeText(snippet)
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">{tenant.company_name}</h1>
        <p className="text-sm text-zinc-400">Tenant ID: {tenant.tenant_id}</p>
      </div>

      <div className="flex gap-3">
        <Button variant={tab === "overview" ? "default" : "outline"} onClick={() => setTab("overview")}>Overview</Button>
        <Button variant={tab === "helpdesk" ? "default" : "outline"} onClick={() => setTab("helpdesk")}>Helpdesk Widget</Button>
      </div>

      {tab === "overview" ? (
        <div className="space-y-8">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-zinc-400">Status</CardTitle></CardHeader><CardContent><Badge variant={tenant.status === "active" ? "success" : "violet"}>{tenant.status}</Badge></CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-zinc-400">Package</CardTitle></CardHeader><CardContent><p className="text-xl font-bold text-white">{tenant.package}</p></CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-zinc-400">Billing</CardTitle></CardHeader><CardContent><p className="text-xl font-bold text-white">{billing?.billing_status ?? tenant.billing_status}</p></CardContent></Card>
          </div>

          <Card>
            <CardHeader><CardTitle>Agent Profile</CardTitle></CardHeader>
            <CardContent>
              {agent ? (
                <div className="grid gap-4 text-sm md:grid-cols-2">
                  <div><span className="text-zinc-400">Name:</span> <span className="text-white">{agent.agent_name ?? "—"}</span></div>
                  <div><span className="text-zinc-400">Persona:</span> <span className="text-white">{agent.persona_preset ?? "—"}</span></div>
                  <div><span className="text-zinc-400">Active:</span> <Badge variant={agent.active ? "success" : "secondary"}>{String(Boolean(agent.active))}</Badge></div>
                  <div><span className="text-zinc-400">Helpdesk:</span> <Badge variant={agent.helpdesk_enabled ? "success" : "secondary"}>{String(Boolean(agent.helpdesk_enabled))}</Badge></div>
                  <div className="md:col-span-2"><span className="text-zinc-400">Greeting:</span> <p className="mt-1 whitespace-pre-wrap text-white">{agent.greeting_message ?? "—"}</p></div>
                </div>
              ) : <p className="text-sm text-zinc-500">No agent profile yet.</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Usage</CardTitle></CardHeader>
            <CardContent>
              {usage?.usage ? <p className="text-white">Queries: {usage.usage.query_count} / {tenant.quota_monthly ?? "unlimited"}</p> : <p className="text-sm text-zinc-500">No usage data.</p>}
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Helpdesk Widget</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-zinc-400">Embed this script on the tenant website to launch the UniVRse helpdesk widget.</p>
            <pre className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950/70 p-4 text-xs text-zinc-200 whitespace-pre-wrap">{snippet}</pre>
            <Button onClick={copySnippet}>Copy</Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
