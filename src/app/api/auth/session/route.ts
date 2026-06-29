import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"

export async function GET() {
  try {
    const cookieStore = cookies()
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { storageKey: "sb-session", storage: { getItem: (k) => cookieStore.get(k)?.value ?? null, setItem: () => {}, removeItem: () => {} } } }
    )
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) {
      return NextResponse.json({ ok: false, error: { code: "UNAUTHORIZED" } }, { status: 401 })
    }
    const { data: du } = await supabase.from("dashboard_users").select("role, tenant_id").eq("user_id", user.id).maybeSingle()
    return NextResponse.json({ ok: true, data: { user_id: user.id, email: user.email, role: du?.role ?? "unknown", tenant_id: du?.tenant_id ?? null } })
  } catch {
    return NextResponse.json({ ok: false, error: { code: "UNAUTHORIZED" } }, { status: 401 })
  }
}
