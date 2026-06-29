"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase"

export default function LoginPage() {
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
    const { error: authError, data } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) { setError(authError.message); setLoading(false); return }
    const { data: du } = await supabase.from("dashboard_users").select("role").eq("user_id", data.user.id).maybeSingle()
    const role = du?.role ?? "unknown"
    router.push(role === "univrse_admin" || role === "tenant_owner" ? "/" : "/client/")
    router.refresh()
  }

  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/callback` } })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#0a0718] via-[#0d0b1e] to-[#110f24]">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8 shadow-2xl">
        <div className="text-center">
          <h1 className="bg-gradient-to-r from-[#EE2A7B] to-[#7F3F98] bg-clip-text text-3xl font-bold text-transparent">UniVRse Dashboard</h1>
          <p className="mt-2 text-sm text-zinc-400">Sign in to manage your AI workspace</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@univrse.my" required /></div>
          <div className="space-y-2"><Label htmlFor="password">Password</Label><Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button type="submit" disabled={loading} className="w-full rounded-full bg-gradient-to-r from-[#EE2A7B] to-[#c41e62] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#EE2A7B]/25 transition-all hover:shadow-xl hover:shadow-[#EE2A7B]/40 disabled:opacity-50">{loading ? "Signing in..." : "Sign in"}</button>
        </form>
        <div className="relative"><div className="absolute inset-0 flex items-center"><span className="w-full border-t border-zinc-800" /></div><div className="relative flex justify-center text-xs uppercase"><span className="bg-zinc-950 px-2 text-zinc-500">or</span></div></div>
        <button onClick={signInWithGoogle} className="w-full rounded-full border border-zinc-700 bg-zinc-900/50 px-4 py-2.5 text-sm text-zinc-300 transition-colors hover:bg-zinc-800">Sign in with Google</button>
      </div>
    </div>
  )
}
