import { SupportRequestPanel } from "@/components/client/SupportRequestPanel"
import { fetchLocalApi } from "@/lib/server-api"

interface SupportResponse {
  ok: boolean
  data: Array<{
    id: string
    subject: string
    message: string
    contact_phone?: string | null
    category?: string | null
    priority?: string | null
    status: string
    created_at: string
    resolved_at?: string | null
  }>
}

export default async function ClientSupportPage() {
  const supportRes = await fetchLocalApi<SupportResponse>("/api/client/support")
  const items = supportRes.json?.data ?? []

  const whatsappNumber = process.env.SUPPORT_WHATSAPP_NUMBER ?? null
  const helpCenterUrl = process.env.SUPPORT_HELP_CENTER_URL ?? null

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Support</h1>
        <p className="text-sm text-zinc-400">Submit and track support requests for your account.</p>
      </div>
      <SupportRequestPanel
        items={items}
        whatsappNumber={whatsappNumber}
        helpCenterUrl={helpCenterUrl}
      />
    </div>
  )
}
