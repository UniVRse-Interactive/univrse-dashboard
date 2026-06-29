import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <div><h1 className="text-2xl font-bold text-white">Settings</h1><p className="text-sm text-zinc-400">Admin configuration</p></div>
      <Card><CardHeader><CardTitle>Account</CardTitle></CardHeader><CardContent><p className="text-sm text-zinc-500">Settings panel — D4 scope.</p></CardContent></Card>
    </div>
  )
}
