"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const NAV = [
  { href: "/client", label: "Overview" },
  { href: "/client/agent", label: "Agent Config" },
  { href: "/client/team", label: "Team" },
  { href: "/client/usage", label: "Usage" },
  { href: "/client/billing", label: "Billing" },
  { href: "/client/support", label: "Support" },
  { href: "/client/settings", label: "Settings" },
]

export function ClientSidebar({
  companyName,
  displayName,
  role,
}: {
  companyName?: string
  displayName?: string
  role?: string
}) {
  const pathname = usePathname()

  return (
    <aside className="flex w-72 flex-col border-r border-zinc-800 bg-zinc-950/50">
      <div className="border-b border-zinc-800 p-6">
        <h1 className="bg-gradient-to-r from-[#EE2A7B] to-[#7F3F98] bg-clip-text text-lg font-bold text-transparent">UniVRse</h1>
        <p className="mt-1 text-sm text-zinc-200">{companyName ?? "Tenant Workspace"}</p>
        <p className="mt-1 text-xs text-zinc-500">PIC self-service portal</p>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {NAV.map((item) => {
          const active = pathname === item.href || (item.href !== "/client" && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active ? "bg-[#EE2A7B]/10 text-[#EE2A7B]" : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
              )}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div className="border-t border-zinc-800 p-4">
        <div className="mb-3">
          <p className="text-sm text-zinc-200">{displayName ?? "User"}</p>
          {role && <span className="mt-1 inline-block rounded-full bg-[#EE2A7B]/10 px-2 py-0.5 text-xs text-[#EE2A7B]">{role}</span>}
        </div>
        <form action="/api/auth/signout" method="POST">
          <button className="w-full rounded-lg border border-zinc-800 px-3 py-2 text-xs text-zinc-400 transition-colors hover:border-[#EE2A7B] hover:text-[#EE2A7B]">
            Sign out
          </button>
        </form>
      </div>
    </aside>
  )
}
