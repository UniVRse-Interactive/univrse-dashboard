import { ContractPendingPage } from "@/components/owner/ContractPendingPage"

export default function InfoGatePage() {
  return (
    <ContractPendingPage
      title="Info Gate"
      description="Configure knowledge access and guardrail behavior once the approved Info Gate contract is available."
      pendingLabel="Configuration contract pending"
      requirements={[
        "Knowledge-source configuration and tier access contract",
        "Guardrail sensitivity and action enums",
        "Activity-log schema with tenant and identity mapping",
        "Simulation endpoint that never sends a WhatsApp reply",
      ]}
    />
  )
}
