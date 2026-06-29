import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = { title: "UniVRse Dashboard", description: "UniVRse Owner + Client Dashboard" }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en" className="dark"><body className="min-h-screen bg-[#0a0718] font-sans antialiased">{children}</body></html>
}
