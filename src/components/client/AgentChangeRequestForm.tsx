"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

interface AgentProfile {
  agent_name?: string | null
  greeting_message?: string | null
  persona_preset?: string | null
  tenant_status?: string | null
  company_name?: string | null
}

const PERSONA_LABELS: Record<string, string> = {
  professional_friendly: "Professional & Friendly",
  formal: "Formal",
  casual_friendly: "Casual & Friendly",
}

function truncate(val: string | null | undefined, max = 32): string | null {
  if (!val) return null
  return val.length > max ? val.slice(0, max) + "…" : val
}

const PLACEHOLDERS: Record<string, string> = {
  agent_name: 'e.g. "Please rename the agent to Hani Venturi Hallmark"',
  greeting: 'e.g. "Please change the greeting to: Welcome to Venturi Hallmark! How can I assist you today?"',
  persona: 'e.g. "Please make the agent more formal and concise in tone"',
  language: 'e.g. "Please switch to Malay (Bahasa Melayu) as the default language"',
  other: 'e.g. "I would like to discuss enabling the helpdesk widget for our website"',
}

export function AgentChangeRequestForm({ agent }: { agent: AgentProfile }) {
  const router = useRouter()
  const [changeType, setChangeType] = useState("agent_name")
  const [newValue, setNewValue] = useState("")
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState("")

  const agentDisplayName = agent.agent_name ?? (agent.company_name ? `Hani ${agent.company_name}` : "Hani")
  const personaLabel = PERSONA_LABELS[agent.persona_preset ?? ""] ?? null

  const options = [
    { value: "agent_name", label: "Agent name", current: truncate(agentDisplayName) },
    { value: "greeting", label: "Greeting message", current: truncate(agent.greeting_message) },
    { value: "persona", label: "Personality / tone", current: personaLabel ?? "Professional & Friendly" },
    { value: "language", label: "Language", current: "English" },
    { value: "other", label: "Something else", current: null },
  ]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError("")
    setSuccess("")
    const currentOption = options.find((o) => o.value === changeType)
    const res = await fetch("/api/client/change-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        change_type: changeType,
        old_value: currentOption?.current ?? null,
        new_value: newValue,
      }),
    })
    const payload = await res.json().catch(() => null)
    if (!res.ok) {
      setError(payload?.error?.message ?? payload?.error?.code ?? "Request failed")
      setSaving(false)
      return
    }
    setNewValue("")
    setSuccess("Change request submitted. You will be notified when it is approved.")
    setSaving(false)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-zinc-800 bg-zinc-950/40 p-5">
      <div>
        <h3 className="text-base font-semibold text-white">Request a change</h3>
        <p className="mt-1 text-xs text-zinc-500">All changes require approval before taking effect.</p>
      </div>

      <label className="block space-y-2 text-sm text-zinc-300">
        <span>What would you like to change?</span>
        <select
          value={changeType}
          onChange={(e) => {
            setChangeType(e.target.value)
            setSuccess("")
            setError("")
          }}
          className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}{opt.current ? ` (currently: ${opt.current})` : ""}
            </option>
          ))}
        </select>
      </label>

      <label className="block space-y-2 text-sm text-zinc-300">
        <span>Describe your request</span>
        <textarea
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          required
          placeholder={PLACEHOLDERS[changeType] ?? "Describe what you would like changed"}
          className="min-h-[110px] w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white placeholder:text-zinc-600"
        />
      </label>

      {error && <p className="text-sm text-red-400">{error}</p>}
      {success && <p className="text-sm text-emerald-400">{success}</p>}

      <div className="space-y-3">
        <button
          disabled={saving || !newValue.trim()}
          className="rounded-full bg-gradient-to-r from-[#EE2A7B] to-[#7F3F98] px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {saving ? "Submitting…" : "Submit Change Request"}
        </button>
        <p className="text-xs text-zinc-500">
          ⓘ Requests are reviewed within 1–2 business days. You will be notified when your change is approved.
        </p>
      </div>
    </form>
  )
}
