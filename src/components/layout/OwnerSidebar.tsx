"use client"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

const NAV = [
  { href: "/", label: "Overview" },
  { href: "/info-gate", label: "Info Gate" },
  { href: "/tenants", label: "Tenants" },
  { href: "/analytics", label: "Global Analytics" },
  { href: "/system", label: "System Health" },
  { href: "/audit", label: "Audit Log" },
  { href: "/packages", label: "Packages" },
  { href: "/settings", label: "Settings" },
]

export function OwnerSidebar({ user }: { user: { email?: string; role?: string } }) {
  const pathname = usePathname()
  const router = useRouter()

  return (
    <aside className="flex w-64 flex-col border-r border-zinc-800 bg-zinc-950/50">
      <div className="border-b border-zinc-800 p-6">
        <h1 className="bg-gradient-to-r from-[#EE2A7B] to-[#7F3F98] bg-clip-text text-lg font-bold text-transparent">UniVRse</h1>
        <p className="mt-1 text-xs text-zinc-500">{user.email}</p>
        {user.role && <span className="mt-1 inline-block rounded-full bg-[#EE2A7B]/10 px-2 py-0.5 text-xs text-[#EE2A7B]">{user.role}</span>}
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {NAV.map((item) => (
          <Link key={item.href} href={item.href} className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors", pathname === item.href ? "bg-[#EE2A7B]/10 text-[#EE2A7B]" : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100")}>
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="border-t border-zinc-800 p-4">
        <form action="/api/auth/signout" method="POST">
          <button className="w-full rounded-lg border border-zinc-800 px-3 py-2 text-xs text-zinc-400 hover:border-[#EE2A7B] hover:text-[#EE2A7B] transition-colors">Sign out</button>
        </form>
      </div>
    </aside>
  )
}
