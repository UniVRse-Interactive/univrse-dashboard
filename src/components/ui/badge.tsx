import * as React from "react"
import { cn } from "@/lib/utils"

const VARIANTS: Record<string, string> = {
  default: "border-transparent bg-[#EE2A7B] text-white",
  secondary: "border-transparent bg-zinc-800 text-zinc-100",
  outline: "text-zinc-400 border-zinc-700",
  violet: "border-transparent bg-[#7F3F98] text-white",
  success: "border-transparent bg-emerald-900/50 text-emerald-400",
  warning: "border-transparent bg-amber-900/50 text-amber-400",
  destructive: "border-transparent bg-red-900/50 text-red-400",
}

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> { variant?: keyof typeof VARIANTS }

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return <div className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold", VARIANTS[variant], className)} {...props} />
}

