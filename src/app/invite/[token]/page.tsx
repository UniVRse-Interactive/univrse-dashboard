"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface ValidatePayload {
  ok: boolean
  data?: {
    tenant_name: string | null
    role: string | null
    expires_at: string | null
    valid: boolean
  }
  error?: { code?: string; message?: string }
}

export default function InviteTokenPage() {
  const params = useParams<{ token: string }>()
  const router = useRouter()
  const token = useMemo(() => (typeof params?.token === "string" ? params.token : ""), [params])
  const [state, setState] = useState<"loading" | "valid" | "invalid">("loading")
  const [tenantName, setTenantName] = useState<string | null>(null)
  const [role, setRole] = useState<string | null>(null)
  const [expiresAt, setExpiresAt] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let ignore = false

    async function loadInvite() {
      setState("loading")
      setError("")
      const res = await fetch(`/api/auth/invite/validate?token=${encodeURIComponent(token)}`, { cache: "no-store" })
      const payload = (await res.json().catch(() => null)) as ValidatePayload | null
      if (ignore) return

      if (res.ok && payload?.data?.valid) {
        setTenantName(payload.data.tenant_name ?? null)
        setRole(payload.data.role ?? null)
        setExpiresAt(payload.data.expires_at ?? null)
        setState("valid")
        return
      }

      setState("invalid")
      setError(payload?.error?.message ?? "This invite is invalid or expired.")
    }

    if (!token) {
      setState("invalid")
      setError("This invite is invalid or expired.")
      return
    }

    loadInvite()
    return () => {
      ignore = true
    }
  }, [token])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (!displayName.trim()) {
      setError("Display name is required.")
      return
    }
    if (!password) {
      setError("Password is required.")
      return
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    setSubmitting(true)
    const res = await fetch("/api/auth/invite/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, display_name: displayName.trim(), password }),
    })
    const payload = await res.json().catch(() => null)

    if (!res.ok) {
      setError(payload?.error?.message ?? payload?.error?.code ?? "Unable to accept invite.")
      setSubmitting(false)
      return
    }

    router.push(payload?.data?.redirectTo ?? "/client")
    router.refresh()
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#0a0718] via-[#0d0b1e] to-[#110f24] px-4 py-10">
      <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8 shadow-2xl">
        <div className="text-center">
          <h1 className="bg-gradient-to-r from-[#EE2A7B] to-[#7F3F98] bg-clip-text text-3xl font-bold text-transparent">UniVRse Invite</h1>
          <p className="mt-2 text-sm text-zinc-400">Set up your dashboard account from a secure invite link.</p>
        </div>

        {state === "loading" && <p className="mt-8 text-center text-sm text-zinc-400">Checking your invite…</p>}

        {state === "invalid" && (
          <div className="mt-8 rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-center">
            <h2 className="text-lg font-semibold text-white">Invite unavailable</h2>
            <p className="mt-2 text-sm text-zinc-300">{error || "This invite is invalid or expired."}</p>
          </div>
        )}

        {state === "valid" && (
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-5">
              <p className="text-xs uppercase tracking-wide text-zinc-500">Tenant</p>
              <p className="mt-1 text-lg font-semibold text-white">{tenantName ?? "Unknown tenant"}</p>
              <p className="mt-4 text-xs uppercase tracking-wide text-zinc-500">Role</p>
              <p className="mt-1 text-sm text-zinc-200">{role ?? "Unknown role"}</p>
              {expiresAt && <p className="mt-4 text-xs text-zinc-500">Invite expires: {new Date(expiresAt).toLocaleString()}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="display_name">Display name</Label>
              <Input id="display_name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm_password">Confirm password</Label>
              <Input id="confirm_password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button type="submit" disabled={submitting} className="w-full rounded-full bg-gradient-to-r from-[#EE2A7B] to-[#7F3F98] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
              {submitting ? "Creating account…" : "Create account"}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
