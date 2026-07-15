import { ContractPendingPage } from "@/components/owner/ContractPendingPage"

export default function AnalyticsPage() {
  return (
    <ContractPendingPage
      title="Global Analytics"
      description="Cross-tenant usage and operational analytics will appear here when the analytics data contract is connected."
      pendingLabel="Analytics data contract pending"
      requirements={[
        "Cross-tenant usage aggregation",
        "Guardrail event metrics",
        "Tenant usage and failure-rate definitions",
        "Approved revenue and package reporting contract",
      ]}
    />
  )
}
