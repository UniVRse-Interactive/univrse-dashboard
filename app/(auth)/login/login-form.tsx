"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) { setError(authError.message); setLoading(false); return }
    router.push("/overview")
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@univrse.my" required /></div>
      <div className="space-y-2"><Label htmlFor="password">Password</Label><Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button type="submit" disabled={loading} className="w-full rounded-full bg-gradient-to-r from-[#EE2A7B] to-[#c41e62] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#EE2A7B]/25 transition-all hover:shadow-xl hover:shadow-[#EE2A7B]/40 disabled:opacity-50">{loading ? "Signing in..." : "Sign in"}</button>
    </form>
  )
}
