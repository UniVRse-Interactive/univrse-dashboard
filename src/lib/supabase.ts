import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export function createServerClient(cookieStore: { get: (name: string) => { value: string } | undefined; set: (name: string, value: string, options: Record<string, unknown>) => void; remove: (name: string, options: Record<string, unknown>) => void }) {
  const { createServerClient: _create } = require("@supabase/ssr")
  return _create(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          cookieStore.set(name, value, options)
        },
        remove(name: string, options: Record<string, unknown>) {
          cookieStore.remove(name, options)
        },
      },
    }
  )
}
