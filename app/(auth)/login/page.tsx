import { LoginForm } from "./login-form"

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#0a0718] via-[#0d0b1e] to-[#110f24]">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8 shadow-2xl">
        <div className="text-center">
          <h1 className="bg-gradient-to-r from-[#EE2A7B] to-[#7F3F98] bg-clip-text text-3xl font-bold text-transparent">UniVRse Dashboard</h1>
          <p className="mt-2 text-sm text-zinc-400">Sign in to manage your AI workspace</p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
