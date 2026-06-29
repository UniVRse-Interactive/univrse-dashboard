import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export interface AuthContext {
  userId: string
  email: string
  role: string
  tenantId: string | null
}

export async function requireAuth(): Promise<AuthContext> {
  const cookieStore = cookies()
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        storageKey: "sb-session",
        storage: {
          getItem: (key) => cookieStore.get(key)?.value ?? null,
          setItem: () => {},
          removeItem: () => {},
        },
      },
    }
  )
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    throw new AuthError("UNAUTHORIZED", 401)
  }
  let role = "unknown"
  let tenantId: string | null = null
  const { data: du } = await supabase
    .from("dashboard_users")
    .select("role, tenant_id")
    .eq("user_id", user.id)
    .maybeSingle()
  if (du) {
    role = du.role
    tenantId = du.tenant_id
  }
  return { userId: user.id, email: user.email ?? "", role, tenantId }
}

export function requireAdmin(ctx: AuthContext): void {
  if (ctx.role !== "univrse_admin" && ctx.role !== "tenant_owner") {
    throw new AuthError("FORBIDDEN", 403)
  }
}

export function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

export class AuthError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}
