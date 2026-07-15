import { ContractPendingPage } from "@/components/owner/ContractPendingPage"

export default function PackagesPage() {
  return (
    <ContractPendingPage
      title="Packages"
      description="Package management will be available when the approved package catalog contract is connected."
      pendingLabel="Package catalog contract pending"
      requirements={[
        "Human-readable package catalog",
        "Seat, message quota, channel, and feature-flag definitions",
        "Price and billing-status contract",
        "Package update authorization policy",
      ]}
    />
  )
}
