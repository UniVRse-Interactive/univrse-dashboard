"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

interface AgentProfile {
  agent_name?: string | null
  persona_preset?: string | null
  greeting_message?: string | null
  active?: boolean | null
  helpdesk_enabled?: boolean | null
}

interface ChangeRequest {
  id: string
  change_type: string
  old_value?: string | null
  new_value?: string | null
  approval_note?: string | null
  created_at: string
  status: string
}

const PERSONAS = ["Professional Friendly", "Formal", "Casual"] as const

export function AgentConfigStudio({ tenantId, tenantName, initialAgent, pendingRequests }: { tenantId: string; tenantName: string; initialAgent: AgentProfile | null; pendingRequests: ChangeRequest[] }) {
  const router = useRouter()
  const [agentName, setAgentName] = useState(initialAgent?.agent_name ?? "")
  const [personaPreset, setPersonaPreset] = useState(initialAgent?.persona_preset ?? "Professional Friendly")
  const [greetingMessage, setGreetingMessage] = useState(initialAgent?.greeting_message ?? "")
  const [active, setActive] = useState(Boolean(initialAgent?.active))
  const [helpdeskEnabled, setHelpdeskEnabled] = useState(Boolean(initialAgent?.helpdesk_enabled))
  const [saving, setSaving] = useState(false)
  const [actingId, setActingId] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  async function saveConfig(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError("")
    setSuccess("")

    const res = await fetch(`/api/admin/tenants/${tenantId}/agent`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agent_name: agentName,
        persona_preset: personaPreset,
        greeting_message: greetingMessage,
        active,
        helpdesk_enabled: helpdeskEnabled,
      }),
    })
    const payload = await res.json().catch(() => null)
    if (!res.ok) {
      setError(payload?.error?.message ?? payload?.error?.code ?? "Unable to save agent config")
      setSaving(false)
      return
    }

    setSuccess("Agent configuration saved.")
    setSaving(false)
    router.refresh()
  }

  async function resolveRequest(id: string, action: "approve" | "reject") {
    setActingId(id)
    setError("")
    setSuccess("")
    const res = await fetch(`/api/admin/change-requests/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    })
    const payload = await res.json().catch(() => null)
    if (!res.ok) {
      setError(payload?.error?.message ?? payload?.error?.code ?? `Unable to ${action} request`)
      setActingId(null)
      return
    }
    setSuccess(`Change request ${action}d.`)
    setActingId(null)
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Agent Config Studio</h1>
        <p className="mt-1 text-sm text-zinc-400">Tenant: {tenantName} · {tenantId}</p>
      </div>

      <form onSubmit={saveConfig} className="space-y-5 rounded-2xl border border-zinc-800 bg-zinc-950/40 p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="agent_name">Agent name</Label>
            <Input id="agent_name" value={agentName} onChange={(e) => setAgentName(e.target.value)} placeholder="Hani" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="persona_preset">Persona preset</Label>
            <Select id="persona_preset" value={personaPreset} onChange={(e) => setPersonaPreset(e.target.value)}>
              {PERSONAS.map((persona) => <option key={persona} value={persona}>{persona}</option>)}
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="greeting_message">Greeting message</Label>
          <Textarea id="greeting_message" value={greetingMessage} onChange={(e) => setGreetingMessage(e.target.value)} className="min-h-[140px]" placeholder="Hi, welcome to UniVRse..." />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-sm text-zinc-200">
            <Checkbox checked={active} onChange={(e) => setActive(e.target.checked)} />
            <span>Agent active</span>
          </label>
          <label className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-sm text-zinc-200">
            <Checkbox checked={helpdeskEnabled} onChange={(e) => setHelpdeskEnabled(e.target.checked)} />
            <span>Helpdesk enabled</span>
          </label>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}
        {success && <p className="text-sm text-emerald-400">{success}</p>}
        <Button disabled={saving}>{saving ? "Saving..." : "Save agent config"}</Button>
      </form>

      <div className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-950/30 p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Pending change requests</h2>
            <p className="text-sm text-zinc-500">Approve or reject tenant PIC requests inline.</p>
          </div>
          <Badge variant="warning">{pendingRequests.length} pending</Badge>
        </div>

        {pendingRequests.length === 0 && <p className="text-sm text-zinc-500">No pending change requests for this tenant.</p>}

        {pendingRequests.map((request) => (
          <div key={request.id} className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium text-white">{request.change_type}</p>
                <p className="text-xs text-zinc-500">{new Date(request.created_at).toLocaleString()}</p>
              </div>
              <Badge variant="warning">pending</Badge>
            </div>
            <div className="grid gap-3 text-sm md:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-zinc-500">Old value</p>
                <p className="mt-1 whitespace-pre-wrap text-zinc-200">{request.old_value || "—"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-zinc-500">Requested new value</p>
                <p className="mt-1 whitespace-pre-wrap text-zinc-200">{request.new_value || "—"}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button disabled={actingId === request.id} onClick={() => resolveRequest(request.id, "approve")}>Approve</Button>
              <Button disabled={actingId === request.id} variant="destructive" onClick={() => resolveRequest(request.id, "reject")}>Reject</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
