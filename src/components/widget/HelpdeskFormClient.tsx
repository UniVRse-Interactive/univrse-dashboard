"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export function HelpdeskFormClient({ tenantId }: { tenantId: string }) {
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [message, setMessage] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError("")
    const res = await fetch("/api/widget/helpdesk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenant_id: tenantId, name, phone, message }),
    })
    const payload = await res.json().catch(() => null)
    if (!res.ok) {
      setError(payload?.error?.message ?? payload?.error?.code ?? "Unable to submit helpdesk request")
      setSubmitting(false)
      return
    }
    setSubmitted(true)
    setSubmitting(false)
    window.parent?.postMessage("helpdesk:close", "*")
  }

  return (
    <div className="min-h-screen bg-[#0a0718] px-4 py-6 text-zinc-100">
      <div className="mx-auto max-w-md rounded-2xl border border-zinc-800 bg-zinc-950/80 p-6 shadow-2xl">
        {!submitted ? (
          <form onSubmit={submit} className="space-y-4">
            <div>
              <h1 className="text-xl font-semibold text-white">Helpdesk</h1>
              <p className="mt-1 text-sm text-zinc-400">Send us a WhatsApp support request.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">WhatsApp number</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="60123456789" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} className="min-h-[140px]" required />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <Button disabled={submitting || !tenantId}>{submitting ? "Sending..." : "Send request"}</Button>
          </form>
        ) : (
          <div className="space-y-3 text-center">
            <h1 className="text-xl font-semibold text-white">Thank you</h1>
            <p className="text-sm text-zinc-400">Your request has been submitted. We’ll follow up on WhatsApp.</p>
          </div>
        )}
      </div>
    </div>
  )
}
