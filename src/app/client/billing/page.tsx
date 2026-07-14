import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { fetchLocalApi } from "@/lib/server-api"

interface BillingResponse {
  ok: boolean
  data: {
    billing_status?: string | null
    tenant_status?: string | null
    package_name?: string | null
    quota_limit?: number | null
    max_staff?: number | null
    seat_used?: number | null
    company_used?: number | null
    billing_period?: string | null
  } | null
}

const PACKAGE_LABELS: Record<string, string> = {
  starter: "Starter Package",
  business: "Business Package",
  enterprise: "Enterprise Package",
}

const PACKAGE_FEATURES: Record<string, { whatsapp: boolean; telegram: boolean; kb: boolean }> = {
  starter: { whatsapp: true, telegram: false, kb: false },
  business: { whatsapp: true, telegram: true, kb: true },
  enterprise: { whatsapp: true, telegram: true, kb: true },
}

function formatBillingPeriod(period: string | null | undefined): string | null {
  if (!period) return null
  const [year, month] = period.split("-")
  if (!year || !month) return period
  const date = new Date(Number(year), Number(month) - 1, 1)
  return date.toLocaleDateString("en-MY", { month: "long", year: "numeric" })
}

function statusLabel(tenantStatus: string | null | undefined, billingStatus: string | null | undefined): string {
  if (tenantStatus === "suspended" || billingStatus === "suspended") return "Suspended"
  if (billingStatus === "overdue") return "Overdue"
  if (tenantStatus === "trial" && billingStatus === "paid") return "Active (Trial)"
  if (tenantStatus === "active" && billingStatus === "paid") return "Active (Paid)"
  if (billingStatus === "paid") return "Active"
  return billingStatus ?? tenantStatus ?? "Unknown"
}

function statusVariant(
  tenantStatus: string | null | undefined,
  billingStatus: string | null | undefined
): "success" | "warning" | "secondary" | "destructive" {
  if (tenantStatus === "suspended" || billingStatus === "suspended") return "secondary"
  if (billingStatus === "overdue") return "warning"
  if (billingStatus === "paid") return "success"
  return "secondary"
}

export default async function ClientBillingPage() {
  const billingRes = await fetchLocalApi<BillingResponse>("/api/client/billing")
  const b = billingRes.json?.data ?? {}

  const packageKey = b.package_name ?? ""
  const packageLabel = PACKAGE_LABELS[packageKey] ?? (packageKey ? `${packageKey.charAt(0).toUpperCase()}${packageKey.slice(1)} Package` : "Unknown Package")
  const features = PACKAGE_FEATURES[packageKey] ?? { whatsapp: true, telegram: false, kb: false }
  const periodLabel = formatBillingPeriod(b.billing_period)
  const quotaLimit = b.quota_limit ?? 0
  const maxStaff = b.max_staff ?? 0
  const seatUsed = b.seat_used ?? 0
  const companyUsed = b.company_used ?? 0

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Billing</h1>
        <p className="text-sm text-zinc-400">Read-only billing and package information for your account.</p>
      </div>

      {/* Current plan */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>{packageLabel}</CardTitle>
              {periodLabel && <p className="mt-1 text-xs text-zinc-500">Billing period: {periodLabel}</p>}
            </div>
            <Badge variant={statusVariant(b.tenant_status, b.billing_status)}>
              {statusLabel(b.tenant_status, b.billing_status)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Feature matrix */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
            {/* Seats */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/30 p-3 text-center">
              <p className="text-xs text-zinc-500 mb-1.5">👥 Seats</p>
              <p className="text-base font-semibold text-white">
                {seatUsed} <span className="text-zinc-500 font-normal">/ {maxStaff || "—"}</span>
              </p>
              <p className="text-xs text-zinc-600 mt-0.5">used this period</p>
            </div>

            {/* Messages */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/30 p-3 text-center">
              <p className="text-xs text-zinc-500 mb-1.5">💬 Messages</p>
              <p className="text-base font-semibold text-white">
                {companyUsed} <span className="text-zinc-500 font-normal">/ {quotaLimit || "—"}</span>
              </p>
              <p className="text-xs text-zinc-600 mt-0.5">used this month</p>
            </div>

            {/* WhatsApp */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/30 p-3 text-center">
              <p className="text-xs text-zinc-500 mb-1.5">WhatsApp</p>
              <p className={`text-lg font-semibold ${features.whatsapp ? "text-green-500" : "text-zinc-600"}`}>
                {features.whatsapp ? "✓" : "–"}
              </p>
              <p className="text-xs text-zinc-600 mt-0.5">{features.whatsapp ? "Included" : "Not included"}</p>
            </div>

            {/* Telegram */}
            <div className={`rounded-xl border p-3 text-center ${features.telegram ? "border-zinc-800 bg-zinc-950/30" : "border-zinc-900 bg-zinc-950/10 opacity-60"}`}>
              <p className="text-xs text-zinc-500 mb-1.5">Telegram</p>
              <p className={`text-lg font-semibold ${features.telegram ? "text-green-500" : "text-zinc-600"}`}>
                {features.telegram ? "✓" : "–"}
              </p>
              <p className="text-xs text-zinc-600 mt-0.5">{features.telegram ? "Included" : "Not included"}</p>
            </div>

            {/* Knowledge Base */}
            <div className={`rounded-xl border p-3 text-center col-span-2 sm:col-span-1 ${features.kb ? "border-zinc-800 bg-zinc-950/30" : "border-zinc-900 bg-zinc-950/10 opacity-60"}`}>
              <p className="text-xs text-zinc-500 mb-1.5">📚 Knowledge Base</p>
              <p className={`text-lg font-semibold ${features.kb ? "text-green-500" : "text-zinc-600"}`}>
                {features.kb ? "✓" : "–"}
              </p>
              <p className="text-xs text-zinc-600 mt-0.5">{features.kb ? "Included" : "Not included"}</p>
            </div>
          </div>

          <p className="text-xs text-zinc-600 border-t border-zinc-800 pt-4">
            ⓘ To upgrade or change your plan, contact UniVRse support. PIC users cannot modify billing, package, or quota from this portal.
          </p>
        </CardContent>
      </Card>

      {/* Payment method */}
      <Card>
        <CardHeader><CardTitle>Payment method</CardTitle></CardHeader>
        <CardContent>
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/30 p-5 space-y-2">
            <p className="text-sm font-medium text-zinc-400">No payment method on file</p>
            <p className="text-xs text-zinc-600">
              ⓘ Payment methods are managed by UniVRse. Contact{" "}
              <span className="text-zinc-400">support@univrse.io</span>{" "}
              to add or update your payment details.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Invoice history */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Invoice history</CardTitle>
            <span className="text-xs text-zinc-600 border border-zinc-800 rounded-full px-3 py-1 cursor-not-allowed">
              Download all
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {/* Table header */}
          <div className="hidden md:grid md:grid-cols-[1.5fr_1fr_80px_80px_60px] gap-x-4 pb-2 px-1 text-xs uppercase tracking-wide text-zinc-600">
            <span>Date</span>
            <span>Invoice #</span>
            <span>Amount</span>
            <span>Status</span>
            <span>PDF</span>
          </div>

          {/* Empty state */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/30 p-6 text-center space-y-1">
            <p className="text-sm text-zinc-400">No invoices yet</p>
            <p className="text-xs text-zinc-600">
              Your first invoice will appear here once it is issued by UniVRse.
              {b.tenant_status === "trial" && " Your account is currently on a free trial."}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
