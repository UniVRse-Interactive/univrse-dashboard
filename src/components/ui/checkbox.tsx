import * as React from "react"
import { cn } from "@/lib/utils"
const Checkbox = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
  <input type="checkbox" className={cn("h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-[#EE2A7B] focus:ring-[#EE2A7B]", className)} ref={ref} {...props} />
))
Checkbox.displayName = "Checkbox"
export { Checkbox }

