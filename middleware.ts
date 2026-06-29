import { createServerClient } from "@/lib/supabase"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  if (pathname.startsWith("/login") || pathname.startsWith("/callback") || pathname.startsWith("/_next") || pathname.startsWith("/api/webhooks")) return NextResponse.next()
  if (pathname.startsWith("/api/")) return NextResponse.next()
  const supabase = createServerClient({ get: (n: string) => ({ value: request.cookies.get(n)?.value ?? "" }), set: () => {}, remove: () => {} })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL("/login", request.url))
  return NextResponse.next()
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] }

