import { TeamNumbersManager } from "@/components/client/TeamNumbersManager"
import { fetchLocalApi } from "@/lib/server-api"

interface StaffResponse {
  ok: boolean
  data: Array<{ id: string; phone_number: string; name?: string | null; role: string; authorized?: boolean | null }>
}
interface TeamSummary {
  seat_total: number
  seat_used: number
  package_label: string | null
  company_quota: number
  company_used: number
  billing_period: string
  member_usage: Record<string, number>
}
interface SummaryResponse { ok: boolean; data: TeamSummary | null }

export default async function ClientTeamPage() {
  const [staffRes, summaryRes] = await Promise.all([
    fetchLocalApi<StaffResponse>("/api/client/staff"),
    fetchLocalApi<SummaryResponse>("/api/client/staff/summary"),
  ])
  const numbers = staffRes.json?.data ?? []
  const summary = summaryRes.json?.data ?? null

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Team Numbers</h1>
        <p className="text-sm text-zinc-400">Manage staff numbers within your current package limits.</p>
      </div>
      <TeamNumbersManager numbers={numbers} summary={summary} />
    </div>
  )
}
