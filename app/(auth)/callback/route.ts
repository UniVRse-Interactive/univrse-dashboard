import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import { cookies } from "next/headers"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/overview"
  if (code) {
    const supabase = createServerClient({ get: (n) => ({ value: cookies().get(n)?.value ?? "" }), set: () => {}, remove: () => {} })
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(origin + next)
  }
  return NextResponse.redirect(origin + "/login?error=auth_callback_error")
}
