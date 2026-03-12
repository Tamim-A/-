import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuditAction, Database } from "@/types/database";

type Client = SupabaseClient<Database>;

/**
 * Manual audit log insertion — use this for actions that
 * are NOT automatically captured by database triggers
 * (e.g., export operations).
 */
export async function insertAuditLog(
  client: Client,
  params: {
    userId: string;
    action: AuditAction;
    entityType: string;
    entityId?: string;
    oldData?: Record<string, unknown>;
    newData?: Record<string, unknown>;
  }
) {
  return client.from("audit_logs").insert({
    user_id: params.userId,
    action: params.action,
    entity_type: params.entityType,
    entity_id: params.entityId ?? null,
    old_data: params.oldData ?? null,
    new_data: params.newData ?? null,
  });
}

export async function getAuditLogs(
  client: Client,
  options?: {
    entityType?: string;
    entityId?: string;
    userId?: string;
    page?: number;
    pageSize?: number;
  }
) {
  const page = options?.page ?? 1;
  const pageSize = options?.pageSize ?? 50;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = client
    .from("audit_logs")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (options?.entityType) {
    query = query.eq("entity_type", options.entityType);
  }
  if (options?.entityId) {
    query = query.eq("entity_id", options.entityId);
  }
  if (options?.userId) {
    query = query.eq("user_id", options.userId);
  }

  return query;
}
