import { SupportRequestPanel } from "@/components/client/SupportRequestPanel"
import { fetchLocalApi } from "@/lib/server-api"

interface SupportResponse { ok: boolean; data: Array<{ id: string; subject: string; message: string; contact_phone?: string | null; status: string; created_at: string }> }

export default async function ClientSupportPage() {
  const supportRes = await fetchLocalApi<SupportResponse>("/api/client/support")
  const items = supportRes.json?.data ?? []

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Support</h1>
        <p className="text-sm text-zinc-400">Submit and review support requests for your tenant.</p>
      </div>
      <SupportRequestPanel items={items} />
    </div>
  )
}
