import { ValidationError } from "@/lib/api-helpers"

export function validatePhoneNumber(input: string): string {
  const normalized = input.replace(/[^\d]/g, "")
  if (!normalized) throw new ValidationError("phone_number is required")
  if (normalized === "60000000001") throw new ValidationError("60000000001 is reserved for internal smoke tests")
  if (normalized.length < 10 || normalized.length > 15) {
    throw new ValidationError("phone_number must be 10-15 digits")
  }
  return normalized
}
