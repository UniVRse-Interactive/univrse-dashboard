import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = "MYR"): string {
  return new Intl.NumberFormat("en-MY", { style: "currency", currency }).format(amount)
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat("en-MY", { dateStyle: "medium" }).format(new Date(date))
}

export function formatDateTime(date: string): string {
  return new Intl.DateTimeFormat("en-MY", { dateStyle: "medium", timeStyle: "short" }).format(new Date(date))
}
