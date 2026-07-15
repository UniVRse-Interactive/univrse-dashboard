import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type ContractPendingPageProps = {
  title: string
  description: string
  pendingLabel: string
  requirements: string[]
}

export function ContractPendingPage({
  title,
  description,
  pendingLabel,
  requirements,
}: ContractPendingPageProps) {
  return (
    <div className="max-w-4xl space-y-8">
      <div className="space-y-2">
        <Badge variant="violet">Read-only</Badge>
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        <p className="text-sm text-zinc-400">{description}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{pendingLabel}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-zinc-400">
            This surface is intentionally read-only until its live data contract is approved.
            No simulated operational data is shown.
          </p>
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
              Required before live controls
            </p>
            <ul className="space-y-2 text-sm text-zinc-300">
              {requirements.map((requirement) => (
                <li key={requirement} className="rounded-lg border border-zinc-800 bg-zinc-950/40 px-3 py-2">
                  {requirement}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
