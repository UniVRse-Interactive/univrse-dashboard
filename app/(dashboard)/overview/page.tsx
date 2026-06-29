import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function OverviewPage() {
  return (
    <div className="space-y-8">
      <div><h1 className="text-2xl font-bold text-white">Overview</h1><p className="text-sm text-zinc-400">UniVRse operations at a glance</p></div>
      <div className="grid grid-cols-4 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-zinc-400">Total Clients</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-white">0</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-zinc-400">Active</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-[#EE2A7B]">0</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-zinc-400">Open Tickets</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-amber-400">0</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-zinc-400">Status</CardTitle></CardHeader><CardContent><Badge variant="success">Operational</Badge></CardContent></Card>
      </div>
      <Card><CardHeader><CardTitle>Welcome to UniVRse</CardTitle></CardHeader><CardContent><p className="text-sm text-zinc-400">Connect to Supabase to populate live data. API endpoints are live at <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs">/api/*</code></p></CardContent></Card>
    </div>
  )
}
