import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type Client = SupabaseClient<Database>;

/** Get current date boundaries */
function getDateBoundaries() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed
  const quarterStart = new Date(year, Math.floor(month / 3) * 3, 1);

  return {
    monthStart: new Date(year, month, 1).toISOString(),
    quarterStart: quarterStart.toISOString(),
    yearStart: new Date(year, 0, 1).toISOString(),
  };
}

export interface DashboardStats {
  totalBeneficiaries: number;
  totalSupport: number;
  addedThisMonth: number;
  addedThisQuarter: number;
  addedThisYear: number;
}

type CountRow = { count: number };

export async function getDashboardStats(client: Client): Promise<DashboardStats> {
  const { monthStart, quarterStart, yearStart } = getDateBoundaries();

  // Run all count queries in parallel
  const [totalRes, supportRes, monthRes, quarterRes, yearRes] = await Promise.all([
    // Total non-archived beneficiaries
    client
      .from("beneficiaries")
      .select("*", { count: "exact", head: true })
      .neq("status", "archived"),

    // Sum support_amount (non-archived)
    client
      .from("beneficiaries")
      .select("support_amount")
      .neq("status", "archived"),

    // Added this month
    client
      .from("beneficiaries")
      .select("*", { count: "exact", head: true })
      .neq("status", "archived")
      .gte("created_at", monthStart),

    // Added this quarter
    client
      .from("beneficiaries")
      .select("*", { count: "exact", head: true })
      .neq("status", "archived")
      .gte("created_at", quarterStart),

    // Added this year
    client
      .from("beneficiaries")
      .select("*", { count: "exact", head: true })
      .neq("status", "archived")
      .gte("created_at", yearStart),
  ]);

  const totalSupport = ((supportRes.data ?? []) as Array<{ support_amount: number }>)
    .reduce((sum, r) => sum + (r.support_amount || 0), 0);

  return {
    totalBeneficiaries: totalRes.count ?? 0,
    totalSupport,
    addedThisMonth: monthRes.count ?? 0,
    addedThisQuarter: quarterRes.count ?? 0,
    addedThisYear: yearRes.count ?? 0,
  };
}

export interface CityData {
  city: string;
  count: number;
  totalSupport: number;
}

export async function getBeneficiariesByCity(client: Client): Promise<CityData[]> {
  const { data } = await client
    .from("beneficiaries")
    .select("city, support_amount")
    .neq("status", "archived");

  if (!data) return [];

  const rows = data as Array<{ city: string; support_amount: number }>;
  const cityMap = new Map<string, { count: number; totalSupport: number }>();

  for (const row of rows) {
    const existing = cityMap.get(row.city) ?? { count: 0, totalSupport: 0 };
    existing.count++;
    existing.totalSupport += row.support_amount || 0;
    cityMap.set(row.city, existing);
  }

  return Array.from(cityMap.entries())
    .map(([city, stats]) => ({ city, ...stats }))
    .sort((a, b) => b.count - a.count);
}

export interface MonthlyData {
  label: string;
  count: number;
  totalSupport: number;
}

export async function getMonthlyTrend(client: Client, months = 12): Promise<MonthlyData[]> {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);

  const { data } = await client
    .from("beneficiaries")
    .select("created_at, support_amount")
    .neq("status", "archived")
    .gte("created_at", startDate.toISOString())
    .order("created_at", { ascending: true });

  if (!data) return [];

  const rows = data as Array<{ created_at: string; support_amount: number }>;

  // Build month buckets
  const monthMap = new Map<string, { count: number; totalSupport: number }>();

  // Initialize all months (even if empty)
  for (let i = 0; i < months; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - months + 1 + i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthMap.set(key, { count: 0, totalSupport: 0 });
  }

  for (const row of rows) {
    const d = new Date(row.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const existing = monthMap.get(key);
    if (existing) {
      existing.count++;
      existing.totalSupport += row.support_amount || 0;
    }
  }

  const arabicMonths = [
    "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
    "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
  ];

  return Array.from(monthMap.entries()).map(([key, stats]) => {
    const [, m] = key.split("-");
    const monthIdx = parseInt(m, 10) - 1;
    return {
      label: arabicMonths[monthIdx],
      ...stats,
    };
  });
}

export interface RecentBeneficiary {
  id: string;
  full_name: string;
  city: string;
  support_amount: number;
  created_at: string;
}

export async function getRecentBeneficiaries(client: Client, limit = 5): Promise<RecentBeneficiary[]> {
  const { data } = await client
    .from("beneficiaries")
    .select("id, full_name, city, support_amount, created_at")
    .neq("status", "archived")
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []) as RecentBeneficiary[];
}

export interface RecentImport {
  id: string;
  file_name: string;
  imported_at: string;
  total_rows: number;
  success_rows: number;
  failed_rows: number;
  duplicate_rows: number;
}

export async function getRecentImports(client: Client, limit = 5): Promise<RecentImport[]> {
  const { data } = await client
    .from("import_logs")
    .select("id, file_name, imported_at, total_rows, success_rows, failed_rows, duplicate_rows")
    .order("imported_at", { ascending: false })
    .limit(limit);

  return (data ?? []) as RecentImport[];
}

export interface RecentAudit {
  id: string;
  action: string;
  entity_type: string;
  created_at: string;
}

export async function getRecentAuditLogs(client: Client, limit = 8): Promise<RecentAudit[]> {
  const { data } = await client
    .from("audit_logs")
    .select("id, action, entity_type, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []) as RecentAudit[];
}
