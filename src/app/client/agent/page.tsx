import { AgentChangeRequestForm } from "@/components/client/AgentChangeRequestForm"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { fetchLocalApi } from "@/lib/server-api"

interface AgentResponse { ok: boolean; data: { agent_name?: string | null; greeting_message?: string | null; persona_preset?: string | null; active?: boolean | null } | null }
interface ChangeRequestsResponse { ok: boolean; data: Array<{ id: string; change_type: string; new_value: string; status: string; created_at: string }> }

export default async function ClientAgentPage() {
  const [agentRes, requestRes] = await Promise.all([
    fetchLocalApi<AgentResponse>("/api/client/agent"),
    fetchLocalApi<ChangeRequestsResponse>("/api/client/change-requests"),
  ])
  const agent = agentRes.json?.data
  const requests = requestRes.json?.data ?? []

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Agent Config</h1>
        <p className="text-sm text-zinc-400">Read-only view for PICs. Any change must go through approval.</p>
      </div>
      <Card>
        <CardHeader><CardTitle>Current configuration</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div><p className="text-xs uppercase text-zinc-500">Agent name</p><p className="mt-1 text-sm text-white">{agent?.agent_name ?? "Not configured"}</p></div>
          <div><p className="text-xs uppercase text-zinc-500">Persona preset</p><p className="mt-1 text-sm text-white">{agent?.persona_preset ?? "Not configured"}</p></div>
          <div className="md:col-span-2"><p className="text-xs uppercase text-zinc-500">Greeting message</p><p className="mt-1 text-sm text-white">{agent?.greeting_message ?? "Not configured"}</p></div>
          <div><p className="text-xs uppercase text-zinc-500">Active</p><p className="mt-1 text-sm text-white">{typeof agent?.active === "boolean" ? String(agent.active) : "Unknown"}</p></div>
        </CardContent>
      </Card>
      <AgentChangeRequestForm />
      <Card>
        <CardHeader><CardTitle>Recent change requests</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {requests.map((item) => (
            <div key={item.id} className="rounded-xl border border-zinc-800 p-4">
              <div className="flex items-center justify-between"><p className="font-medium text-white">{item.change_type}</p><span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300">{item.status}</span></div>
              <p className="mt-2 text-sm text-zinc-400">Requested: {item.new_value}</p>
              <p className="mt-2 text-xs text-zinc-500">{new Date(item.created_at).toLocaleString()}</p>
            </div>
          ))}
          {requests.length === 0 && <p className="text-sm text-zinc-500">No change requests submitted yet.</p>}
        </CardContent>
      </Card>
    </div>
  )
}
