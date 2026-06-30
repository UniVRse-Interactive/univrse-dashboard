import { cookies, headers } from "next/headers"

function getBaseUrl() {
  const h = headers()
  const configured = process.env.NEXT_PUBLIC_APP_URL
  if (configured) return configured
  const host = h.get("host")
  const proto = h.get("x-forwarded-proto") ?? "http"
  if (host) return `${proto}://${host}`
  return "http://localhost:3000"
}

export async function fetchLocalApi<T = unknown>(path: string, init?: RequestInit) {
  const res = await fetch(`${getBaseUrl()}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      Cookie: cookies().toString(),
      ...(init?.headers ?? {}),
    },
  })

  let json: T | null = null
  try {
    json = (await res.json()) as T
  } catch {
    json = null
  }

  return { status: res.status, ok: res.ok, json }
}
