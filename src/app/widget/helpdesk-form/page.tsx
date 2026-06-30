import { HelpdeskFormClient } from "@/components/widget/HelpdeskFormClient"

export default function HelpdeskFormPage({ searchParams }: { searchParams?: { tenant?: string } }) {
  return <HelpdeskFormClient tenantId={searchParams?.tenant ?? ""} />
}
