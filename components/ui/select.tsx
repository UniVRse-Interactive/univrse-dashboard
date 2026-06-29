import * as React from "react"
import { cn } from "@/lib/utils"

const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(({ className, children, ...props }, ref) => (
  <select className={cn("flex h-10 w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EE2A7B]", className)} ref={ref} {...props}>{children}</select>
))
Select.displayName = "Select"
export { Select }
