import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function TeamPage() {
  return <div className="space-y-8"><div><h1 className="text-2xl font-bold text-white">Team</h1><p className="text-sm text-zinc-400">Manage your team</p></div>
  <Card><CardHeader><CardTitle>Team</CardTitle></CardHeader><CardContent><p className="text-sm text-zinc-500">Ready for data integration. API at <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs">/api/team</code></p></CardContent></Card></div>
}
