import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, UserRole } from "@/types/database";

type Client = SupabaseClient<Database>;

export async function getProfile(client: Client, userId: string) {
  return client.from("profiles").select("*").eq("id", userId).single();
}

export async function listProfiles(client: Client) {
  return client
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });
}

export async function updateProfile(
  client: Client,
  userId: string,
  data: { full_name?: string; role?: UserRole; is_active?: boolean }
) {
  return client
    .from("profiles")
    .update(data)
    .eq("id", userId)
    .select()
    .single();
}
