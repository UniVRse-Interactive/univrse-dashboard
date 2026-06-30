import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createServerClient } from "@/lib/supabase"

function clearSupabaseCookies(response: NextResponse) {
  const cookieStore = cookies()
  const cookieNames = cookieStore
    .getAll()
    .map((cookie) => cookie.name)
    .filter((name) => name.startsWith("sb-") || name === "supabase.auth.token")

  for (const name of cookieNames) {
    response.cookies.set(name, "", {
      path: "/",
      maxAge: 0,
      expires: new Date(0),
    })
  }
}

export async function POST(request: Request) {
  const url = new URL(request.url)
  const redirectUrl = new URL("/login", url.origin)
  const response = NextResponse.redirect(redirectUrl, { status: 303 })

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

    await supabase.auth.signOut()
  } catch {
    // Always continue with local cookie clearing + redirect.
  }

  clearSupabaseCookies(response)
  return response
}
