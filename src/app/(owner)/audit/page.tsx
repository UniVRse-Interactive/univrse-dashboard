import { ContractPendingPage } from "@/components/owner/ContractPendingPage"

export default function AuditPage() {
  return (
    <ContractPendingPage
      title="Audit Log"
      description="System-wide audit review will be available when the approved audit-source contract is connected."
      pendingLabel="Audit source contract pending"
      requirements={[
        "Approved actor, tenant, and action filter contract",
        "Redacted detail-drawer policy",
        "CSV export policy and access control",
        "Guardrail, tenant, staff, billing, and admin event sources",
      ]}
    />
  )
}
