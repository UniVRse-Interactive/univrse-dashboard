import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cookies } from "next/headers"

export default async function SystemPage() {
  return (
    <div className="space-y-8">
      <div><h1 className="text-2xl font-bold text-white">System Health</h1><p className="text-sm text-zinc-400">Infrastructure status</p></div>
      <div className="grid grid-cols-3 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-zinc-400">Database</CardTitle></CardHeader><CardContent><Badge variant="success">Connected</Badge></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-zinc-400">Supabase</CardTitle></CardHeader><CardContent><Badge variant="success">webknmxgdqnzmtaixsbt</Badge></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-zinc-400">Deploy</CardTitle></CardHeader><CardContent><Badge variant="violet">D3 Preview</Badge></CardContent></Card>
      </div>
    </div>
  )
}
