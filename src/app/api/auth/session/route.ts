import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createServerClient } from "@/lib/supabase"
import { getServiceClient } from "@/lib/auth"

export async function GET() {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient({
      get(name) {
        const cookie = cookieStore.get(name)
        return cookie ? { value: cookie.value } : undefined
      },
      set() {},
      remove() {},
    })
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) {
      return NextResponse.json({ ok: false, error: { code: "UNAUTHORIZED" } }, { status: 401 })
    }
    const db = getServiceClient()
    const { data: du } = await db
      .from("dashboard_users")
      .select("role, tenant_id")
      .eq("user_id", user.id)
      .maybeSingle()
    return NextResponse.json({
      ok: true,
      data: {
        user_id: user.id,
        email: user.email,
        role: du?.role ?? "unknown",
        tenant_id: du?.tenant_id ?? null,
      },
    })
  } catch {
    return NextResponse.json({ ok: false, error: { code: "UNAUTHORIZED" } }, { status: 401 })
  }
}
