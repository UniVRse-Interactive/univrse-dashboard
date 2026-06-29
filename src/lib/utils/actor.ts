import { type SupabaseClient } from "@supabase/supabase-js"

export async function setActorContext(
  db: SupabaseClient,
  actorId: string,
  actorRole: string,
  ipAddress: string
): Promise<void> {
  await db.rpc("set_actor_context", {
    p_actor_id: actorId,
    p_actor_role: actorRole,
    p_ip_address: ipAddress || "",
  })
}
