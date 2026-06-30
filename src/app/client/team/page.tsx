import { TeamNumbersManager } from "@/components/client/TeamNumbersManager"
import { fetchLocalApi } from "@/lib/server-api"

interface StaffResponse { ok: boolean; data: Array<{ id: string; phone_number: string; name?: string | null; role: string; authorized?: boolean | null }> }

export default async function ClientTeamPage() {
  const staffRes = await fetchLocalApi<StaffResponse>("/api/client/staff")
  const numbers = staffRes.json?.data ?? []

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Team Numbers</h1>
        <p className="text-sm text-zinc-400">Manage staff numbers within your current package limits.</p>
      </div>
      <TeamNumbersManager numbers={numbers} />
    </div>
  )
}
