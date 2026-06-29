export interface Client {
  id: string
  name: string
  slug: string
  contact_email: string
  plan: "Starter" | "Growth" | "Scale" | "Enterprise"
  status: "trial" | "active" | "past_due" | "paused" | "cancelled"
  billing_day: number
  owner_user_id: string | null
  created_at: string
  updated_at: string
  notes: string | null
}

export interface ClientUser {
  id: string
  client_id: string
  user_id: string | null
  email: string
  name: string
  role: "admin" | "operator" | "billing" | "viewer"
  active: boolean
  created_at: string
  last_login_at: string | null
}

export interface UsageEvent {
  id: string
  client_id: string
  event_type: "messages" | "automations" | "storage_gb" | "api_calls" | "seats"
  quantity: number
  occurred_at: string
  metadata: Record<string, unknown> | null
}

export interface Invoice {
  id: string
  client_id: string
  invoice_no: string
  amount: number
  currency: string
  status: "draft" | "sent" | "paid" | "overdue" | "void"
  due_date: string
  issued_at: string
  paid_at: string | null
  notes: string | null
}

export interface SupportTicket {
  id: string
  client_id: string
  subject: string
  priority: "low" | "normal" | "high" | "urgent"
  status: "open" | "pending" | "resolved"
  assigned_to: string | null
  created_at: string
  updated_at: string
  resolution: string | null
}

export interface DashboardUser {
  user_id: string
  tenant_id: string | null
  role: "univrse_admin" | "univrse_staff" | "tenant_pic" | "tenant_staff"
  display_name: string
  phone_number: string | null
  authorized: boolean
}

export type PlanLimit = {
  monthly_messages: number
  monthly_storage_gb: number
  price: number
}
