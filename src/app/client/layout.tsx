import { ClientSidebar } from "@/components/layout/ClientSidebar"
import { fetchLocalApi } from "@/lib/server-api"
import { redirect } from "next/navigation"

interface SessionResponse {
  ok: boolean
  data?: {
    user_id: string
    email: string
    role: string
    tenant_id: string | null
  }
}

interface ProfileResponse {
  ok: boolean
  data?: {
    display_name?: string | null
    company_name?: string | null
    role?: string | null
  }
}

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const session = await fetchLocalApi<SessionResponse>("/api/auth/session")
  if (session.status === 401 || !session.json?.data) redirect("/login")

  const role = session.json.data.role
  const tenantId = session.json.data.tenant_id
  if (!["tenant_owner", "tenant_pic", "univrse_admin"].includes(role)) redirect("/")
  if (role === "univrse_admin" && !tenantId) redirect("/")

  const profile = await fetchLocalApi<ProfileResponse>("/api/client/profile")
  if (profile.status === 401) redirect("/login")
  if (profile.status === 403) redirect("/")

  return (
    <div className="flex min-h-screen bg-[#090814]">
      <ClientSidebar
        companyName={profile.json?.data?.company_name ?? "Tenant Workspace"}
        displayName={profile.json?.data?.display_name ?? session.json.data.email}
        role={profile.json?.data?.role ?? role}
      />
      <main className="flex-1 overflow-auto p-8">{children}</main>
    </div>
  )
}
