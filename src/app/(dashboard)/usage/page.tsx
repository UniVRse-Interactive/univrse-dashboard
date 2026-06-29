import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
export default function UsagePage() {
  return <div className="space-y-8"><div><h1 className="text-2xl font-bold text-white">Usage</h1><p className="text-sm text-zinc-400">Manage your usage</p></div>
  <Card><CardHeader><CardTitle>Usage</CardTitle></CardHeader><CardContent><p className="text-sm text-zinc-500">Ready for data integration at <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs">/api/usage</code></p></CardContent></Card></div>
}

