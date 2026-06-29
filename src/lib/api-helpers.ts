import { NextResponse } from "next/server"
import { AuthError } from "./auth"

export class ValidationError extends Error {
  constructor(message: string) { super(message); this.name = "ValidationError" }
}

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ ok: true, data }, { status })
}

export function okList<T>(data: T[], total: number, status = 200) {
  return NextResponse.json({ ok: true, data, total }, { status })
}

export function handleError(err: unknown) {
  if (err instanceof AuthError) {
    return NextResponse.json({ ok: false, error: { code: err.message } }, { status: err.status })
  }
  if (err instanceof ValidationError) {
    return NextResponse.json({ ok: false, error: { code: "VALIDATION_ERROR", message: err.message } }, { status: 400 })
  }
  const message = err instanceof Error ? err.message : "Internal server error"
  console.error("[API]", message)
  return NextResponse.json({ ok: false, error: { code: "INTERNAL_ERROR", message } }, { status: 500 })
}
