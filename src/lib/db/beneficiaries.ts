import type { SupabaseClient } from "@supabase/supabase-js";
import type { BeneficiaryStatus, Database } from "@/types/database";

type Client = SupabaseClient<Database>;
type BeneficiaryInsert = Database["public"]["Tables"]["beneficiaries"]["Insert"];
type BeneficiaryUpdate = Database["public"]["Tables"]["beneficiaries"]["Update"];

export async function listBeneficiaries(
  client: Client,
  options?: {
    status?: BeneficiaryStatus;
    search?: string;
    city?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    pageSize?: number;
  }
) {
  const page = options?.page ?? 1;
  const pageSize = options?.pageSize ?? 20;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = client
    .from("beneficiaries")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (options?.status) {
    query = query.eq("status", options.status);
  } else {
    // Hide archived by default
    query = query.neq("status", "archived");
  }

  if (options?.search) {
    const s = options.search;
    query = query.or(
      `full_name.ilike.%${s}%,national_id.ilike.%${s}%,phone.ilike.%${s}%,city.ilike.%${s}%`
    );
  }

  if (options?.city) {
    query = query.eq("city", options.city);
  }

  if (options?.dateFrom) {
    query = query.gte("created_at", options.dateFrom);
  }

  if (options?.dateTo) {
    query = query.lte("created_at", options.dateTo + "T23:59:59");
  }

  return query;
}

export async function getBeneficiaryById(client: Client, id: string) {
  return client.from("beneficiaries").select("*").eq("id", id).single();
}

export async function createBeneficiary(
  client: Client,
  data: BeneficiaryInsert
) {
  return client.from("beneficiaries").insert(data).select().single();
}

export async function updateBeneficiary(
  client: Client,
  id: string,
  data: BeneficiaryUpdate
) {
  return client
    .from("beneficiaries")
    .update(data)
    .eq("id", id)
    .select()
    .single();
}

export async function archiveBeneficiary(
  client: Client,
  id: string,
  userId: string
) {
  return client
    .from("beneficiaries")
    .update({
      status: "archived",
      archived_at: new Date().toISOString(),
      updated_by: userId,
    })
    .eq("id", id)
    .select()
    .single();
}

/** Check if a national_id already exists (excluding a given beneficiary id for edits) */
export async function checkDuplicateNationalId(
  client: Client,
  nationalId: string,
  excludeId?: string
) {
  let query = client
    .from("beneficiaries")
    .select("id, full_name, status")
    .eq("national_id", nationalId);

  if (excludeId) {
    query = query.neq("id", excludeId);
  }

  return query;
}

/** Check if a phone already exists */
export async function checkDuplicatePhone(
  client: Client,
  phone: string,
  excludeId?: string
) {
  let query = client
    .from("beneficiaries")
    .select("id, full_name, national_id, phone, status")
    .eq("phone", phone);

  if (excludeId) {
    query = query.neq("id", excludeId);
  }

  return query;
}

/** Check for similar name + city */
export async function checkSimilarNameCity(
  client: Client,
  fullName: string,
  city: string,
  excludeId?: string
) {
  let query = client
    .from("beneficiaries")
    .select("id, full_name, national_id, city, status")
    .ilike("full_name", `%${fullName}%`)
    .eq("city", city);

  if (excludeId) {
    query = query.neq("id", excludeId);
  }

  return query;
}

/** Get distinct cities for filter dropdowns */
export async function getDistinctCities(client: Client) {
  const { data } = await client
    .from("beneficiaries")
    .select("city")
    .neq("status", "archived")
    .order("city");

  if (!data) return [];
  const unique = [...new Set(data.map((r) => r.city))];
  return unique;
}
