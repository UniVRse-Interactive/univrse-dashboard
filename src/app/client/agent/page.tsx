import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AgentChangeRequestForm } from "@/components/client/AgentChangeRequestForm"
import { fetchLocalApi } from "@/lib/server-api"

interface AgentData {
  agent_name?: string | null
  greeting_message?: string | null
  persona_preset?: string | null
  active?: boolean | null
  updated_at?: string | null
  tenant_status?: string | null
  tenant_billing_status?: string | null
  company_name?: string | null
}

interface ChangeRequest {
  id: string
  change_type: string
  new_value: string
  status: string
  created_at: string
}

interface AgentResponse { ok: boolean; data: AgentData | null }
interface ChangeRequestsResponse { ok: boolean; data: ChangeRequest[] }

const PERSONA_LABELS: Record<string, string> = {
  professional_friendly: "Professional & Friendly",
  formal: "Formal",
  casual_friendly: "Casual & Friendly",
}

const CHANGE_TYPE_LABELS: Record<string, string> = {
  agent_name: "Agent name",
  greeting: "Greeting message",
  persona: "Personality / tone",
  language: "Language",
  helpdesk: "Helpdesk settings",
  other: "Other",
}

const STATUS_CLASSES: Record<string, string> = {
  pending: "bg-yellow-900/40 text-yellow-400",
  approved: "bg-green-900/40 text-green-400",
  rejected: "bg-red-900/40 text-red-400",
  cancelled: "bg-zinc-800 text-zinc-400",
}

function humanizePreset(preset: string | null | undefined): string | null {
  if (!preset) return null
  return PERSONA_LABELS[preset] ?? preset.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
}

export default async function ClientAgentPage() {
  const [agentRes, requestRes] = await Promise.all([
    fetchLocalApi<AgentResponse>("/api/client/agent"),
    fetchLocalApi<ChangeRequestsResponse>("/api/client/change-requests"),
  ])

  const agent = agentRes.json?.data
  const requests = requestRes.json?.data ?? []

  const isActive = agent?.active === true || agent?.tenant_status === "trial" || agent?.tenant_status === "active"
  const agentDisplayName = agent?.agent_name ?? (agent?.company_name ? `Hani ${agent.company_name}` : "Hani")
  const personaLabel = humanizePreset(agent?.persona_preset)

  const updatedLabel = agent?.updated_at
    ? new Date(agent.updated_at).toLocaleDateString("en-MY", { day: "numeric", month: "long", year: "numeric" })
    : null

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Agent Config</h1>
        <p className="text-sm text-zinc-400">Your AI agent&apos;s current configuration. Request changes below.</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Your AI Agent</CardTitle></CardHeader>
        <CardContent className="divide-y divide-zinc-800">
          <div className="flex items-center justify-between py-3 first:pt-0">
            <p className="text-sm text-zinc-400">Name</p>
            <p className="text-sm font-medium text-white">{agentDisplayName}</p>
          </div>
          <div className="flex items-center justify-between py-3">
            <p className="text-sm text-zinc-400">Status</p>
            <Badge variant={isActive ? "success" : "secondary"}>{isActive ? "Active" : "Inactive"}</Badge>
          </div>
          {agent?.greeting_message && (
            <div className="flex flex-col gap-1 py-3">
              <p className="text-sm text-zinc-400">Greeting</p>
              <p className="text-sm italic text-white">&ldquo;{agent.greeting_message}&rdquo;</p>
            </div>
          )}
          {personaLabel && (
            <div className="flex items-center justify-between py-3">
              <p className="text-sm text-zinc-400">Personality</p>
              <p className="text-sm font-medium text-white">{personaLabel}</p>
            </div>
          )}
          <div className="flex items-center justify-between py-3">
            <p className="text-sm text-zinc-400">Language</p>
            <p className="text-sm font-medium text-white">English</p>
          </div>
          {updatedLabel && (
            <div className="flex items-center justify-between py-3 last:pb-0">
              <p className="text-sm text-zinc-400">Last updated</p>
              <p className="text-sm text-zinc-400">{updatedLabel}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <AgentChangeRequestForm
        agent={{
          agent_name: agent?.agent_name ?? null,
          greeting_message: agent?.greeting_message ?? null,
          persona_preset: agent?.persona_preset ?? null,
          tenant_status: agent?.tenant_status ?? null,
          company_name: agent?.company_name ?? null,
        }}
      />

      <Card>
        <CardHeader><CardTitle>Recent change requests</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {requests.map((item) => (
            <div key={item.id} className="rounded-xl border border-zinc-800 p-4">
              <div className="flex items-center justify-between">
                <p className="font-medium text-white">
                  {CHANGE_TYPE_LABELS[item.change_type] ?? item.change_type}
                </p>
                <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_CLASSES[item.status] ?? "bg-zinc-800 text-zinc-300"}`}>
                  {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                </span>
              </div>
              <p className="mt-2 text-sm text-zinc-400">{item.new_value}</p>
              <p className="mt-1 text-xs text-zinc-600">
                {new Date(item.created_at).toLocaleString("en-MY", {
                  timeZone: "Asia/Kuala_Lumpur",
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          ))}
          {requests.length === 0 && (
            <p className="text-sm text-zinc-500">No change requests submitted yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
