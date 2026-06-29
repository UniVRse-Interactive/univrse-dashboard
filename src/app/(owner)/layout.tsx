import { OwnerSidebar } from "@/components/layout/OwnerSidebar"
import { createClient } from "@/lib/supabase"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export default async function OwnerLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = cookies()
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")
  const { data: du } = await supabase.from("dashboard_users").select("role").eq("user_id", user.id).maybeSingle()
  if (!du || (du.role !== "univrse_admin" && du.role !== "tenant_owner")) redirect("/login")
  return <div className="flex min-h-screen"><OwnerSidebar user={{ email: user.email, role: du.role }} /><main className="flex-1 overflow-auto p-8">{children}</main></div>
}
