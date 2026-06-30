export async function sendN8NNotification(payload: {
  event: string
  tenant_id: string
  data: Record<string, unknown>
}): Promise<void> {
  const url = process.env.N8N_NOTIFICATION_WEBHOOK_URL
  if (!url) {
    console.warn("[notify] skipped:", payload.event)
    return
  }

  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000),
    })
  } catch {
    console.warn("[notify] failed — non-fatal:", payload.event)
  }
}
