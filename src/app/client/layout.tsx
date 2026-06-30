import { Sidebar } from "@/components/sidebar"
import { createServerClient } from "@/lib/supabase"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerClient({ get: (n) => ({ value: cookies().get(n)?.value ?? "" }), set: () => {}, remove: () => {} })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")
  return <div className="flex min-h-screen"><Sidebar user={user} /><main className="flex-1 overflow-auto p-8">{children}</main></div>
}

