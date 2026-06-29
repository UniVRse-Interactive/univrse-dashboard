import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function SettingsPage() {
  return <div className="space-y-8"><div><h1 className="text-2xl font-bold text-white">Settings</h1><p className="text-sm text-zinc-400">Manage your settings</p></div>
  <Card><CardHeader><CardTitle>Settings</CardTitle></CardHeader><CardContent><p className="text-sm text-zinc-500">Ready for data integration. API at <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs">/api/settings</code></p></CardContent></Card></div>
}
