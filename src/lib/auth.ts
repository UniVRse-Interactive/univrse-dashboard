import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import { createServerClient } from "@/lib/supabase"

export interface AuthContext {
  userId: string
  email: string
  role: string
  tenantId: string | null
}

export type SessionContext = AuthContext

export class AuthError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

export class ForbiddenError extends AuthError {
  constructor(_message = "FORBIDDEN") {
    super("FORBIDDEN", 403)
  }
}

export async function requireAuth(): Promise<AuthContext> {
  const cookieStore = cookies()
  const supabase = createServerClient({
    get(name) {
      const cookie = cookieStore.get(name)
      return cookie ? { value: cookie.value } : undefined
    },
    set() {},
    remove() {},
  })

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

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
    throw new ForbiddenError("Admin access required")
  }
}

export function requirePicOrOwner(ctx: SessionContext): void {
  if (!["tenant_owner", "tenant_pic", "univrse_admin"].includes(ctx.role)) {
    throw new ForbiddenError("Tenant access required")
  }
}

export function requireTenantScope(ctx: SessionContext, tenantId: string): void {
  if (ctx.role === "univrse_admin") return
  if (ctx.tenantId !== tenantId) throw new ForbiddenError("Tenant scope violation")
}

export function resolveTenantId(ctx: SessionContext): string {
  if (!ctx.tenantId) throw new ForbiddenError("No tenant bound to this account")
  return ctx.tenantId
}

export function getServiceClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!key) {
    throw new Error("supabaseKey is required.")
  }
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false },
  })
}
