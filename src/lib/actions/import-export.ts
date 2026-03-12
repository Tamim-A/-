"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/guard";
import { parseFile } from "@/lib/import/parse";
import { validateRows, summarize, type ValidatedRow } from "@/lib/import/validate";
import { insertAuditLog } from "@/lib/db/audit";
import type { BeneficiaryStatus, Database } from "@/types/database";

type BeneficiaryRow = Database["public"]["Tables"]["beneficiaries"]["Row"];

export interface ImportPreviewResult {
  error?: string;
  rows?: Array<{
    rowNumber: number;
    status: string;
    data: Record<string, unknown> | null;
    rawData: Record<string, unknown>;
    errors: string[];
    warnings: string[];
  }>;
  summary?: {
    total: number;
    valid: number;
    invalid: number;
    duplicate: number;
    warning: number;
  };
  fileName?: string;
}

export interface ImportResult {
  error?: string;
  success?: boolean;
  inserted: number;
  failed: number;
  duplicateDb: number;
  rowErrors: Array<{ rowNumber: number; error: string }>;
}

/**
 * Parse and validate an uploaded file, returning a preview.
 */
export async function previewImportAction(formData: FormData): Promise<ImportPreviewResult> {
  await requireAuth("staff");

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) {
    return { error: "الرجاء اختيار ملف" };
  }

  const validTypes = [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
    "text/csv",
  ];
  const isValidExt = file.name.endsWith(".xlsx") || file.name.endsWith(".csv") || file.name.endsWith(".xls");
  if (!validTypes.includes(file.type) && !isValidExt) {
    return { error: "صيغة الملف غير مدعومة. الصيغ المدعومة: xlsx, csv" };
  }

  if (file.size > 5 * 1024 * 1024) {
    return { error: "حجم الملف يتجاوز الحد الأقصى (5 ميجابايت)" };
  }

  const buffer = await file.arrayBuffer();
  const parsed = parseFile(buffer, file.name);

  if (parsed.error) {
    return { error: parsed.error };
  }

  if (parsed.rows.length === 0) {
    return { error: "الملف لا يحتوي على صفوف بيانات" };
  }

  if (parsed.rows.length > 5000) {
    return { error: "الحد الأقصى للاستيراد 5000 صف في المرة الواحدة" };
  }

  const validated = validateRows(parsed.rows);
  const summary = summarize(validated);

  return {
    rows: validated.map((r) => ({
      rowNumber: r.rowNumber,
      status: r.status,
      data: r.data as Record<string, unknown> | null,
      rawData: r.rawData,
      errors: r.errors,
      warnings: r.warnings,
    })),
    summary,
    fileName: file.name,
  };
}

/**
 * Execute the import — insert valid rows into the database.
 * Checks for DB-level duplicate national_ids.
 */
export async function executeImportAction(
  validatedRowsJson: string,
  fileName: string
): Promise<ImportResult> {
  const session = await requireAuth("staff");
  const supabase = await createServerSupabaseClient();

  let validatedRows: ValidatedRow[];
  try {
    validatedRows = JSON.parse(validatedRowsJson);
  } catch {
    return { error: "بيانات غير صالحة", inserted: 0, failed: 0, duplicateDb: 0, rowErrors: [] };
  }

  // Only process valid/warning rows
  const importable = validatedRows.filter(
    (r) => r.status === "valid" || r.status === "warning"
  );

  if (importable.length === 0) {
    return { error: "لا توجد صفوف صالحة للاستيراد", inserted: 0, failed: 0, duplicateDb: 0, rowErrors: [] };
  }

  // Collect all national_ids to check DB duplicates in batch
  const nationalIds = importable
    .map((r) => r.data?.national_id)
    .filter(Boolean) as string[];

  const { data: existingRaw } = await supabase
    .from("beneficiaries")
    .select("national_id")
    .in("national_id", nationalIds);

  const existingNids = new Set(
    ((existingRaw ?? []) as Array<{ national_id: string }>).map((r) => r.national_id)
  );

  let inserted = 0;
  let failed = 0;
  let duplicateDb = 0;
  const rowErrors: Array<{ rowNumber: number; error: string }> = [];

  // Insert row by row to capture per-row errors
  for (const row of importable) {
    if (!row.data) {
      failed++;
      rowErrors.push({ rowNumber: row.rowNumber, error: "بيانات غير صالحة" });
      continue;
    }

    if (existingNids.has(row.data.national_id)) {
      duplicateDb++;
      rowErrors.push({
        rowNumber: row.rowNumber,
        error: `رقم الهوية ${row.data.national_id} مسجل مسبقاً في قاعدة البيانات`,
      });
      continue;
    }

    const { error } = await supabase.from("beneficiaries").insert({
      national_id: row.data.national_id,
      full_name: row.data.full_name,
      phone: row.data.phone,
      city: row.data.city,
      support_amount: row.data.support_amount,
      notes: row.data.notes ?? null,
      source: "import",
      created_by: session.userId,
      updated_by: session.userId,
    });

    if (error) {
      failed++;
      // Unique constraint violation
      if (error.code === "23505") {
        duplicateDb++;
        rowErrors.push({
          rowNumber: row.rowNumber,
          error: `رقم الهوية ${row.data.national_id} مكرر`,
        });
      } else {
        rowErrors.push({ rowNumber: row.rowNumber, error: error.message });
      }
    } else {
      inserted++;
      // Add to set so subsequent file rows with same nid are caught
      existingNids.add(row.data.national_id);
    }
  }

  const totalRows = validatedRows.length;
  const failedTotal = totalRows - inserted;

  // Log import
  await supabase.from("import_logs").insert({
    file_name: fileName,
    imported_by: session.userId,
    total_rows: totalRows,
    success_rows: inserted,
    failed_rows: failed + validatedRows.filter((r) => r.status === "invalid").length,
    duplicate_rows: duplicateDb + validatedRows.filter((r) => r.status === "duplicate").length,
  });

  // Audit log
  await insertAuditLog(supabase, {
    userId: session.userId,
    action: "import_beneficiaries",
    entityType: "beneficiaries",
    newData: {
      file_name: fileName,
      total_rows: totalRows,
      success_rows: inserted,
      failed_rows: failedTotal,
    },
  });

  revalidatePath("/beneficiaries");
  revalidatePath("/import-export");

  return { success: true, inserted, failed, duplicateDb, rowErrors };
}

/**
 * Export beneficiaries to xlsx — returns base64-encoded file content.
 */
export async function exportBeneficiariesAction(
  filters?: {
    status?: string;
    search?: string;
    city?: string;
    dateFrom?: string;
    dateTo?: string;
  }
): Promise<{ error?: string; base64?: string; fileName?: string }> {
  const session = await requireAuth("staff");
  const supabase = await createServerSupabaseClient();

  // Dynamic import to avoid bundling on every page
  const XLSX = await import("xlsx");

  let query = supabase
    .from("beneficiaries")
    .select("national_id, full_name, phone, city, support_amount, notes, status, created_at")
    .order("created_at", { ascending: false });

  if (filters?.status) {
    query = query.eq("status", filters.status as BeneficiaryStatus);
  } else {
    query = query.neq("status", "archived");
  }

  if (filters?.search) {
    const s = filters.search;
    query = query.or(
      `full_name.ilike.%${s}%,national_id.ilike.%${s}%,phone.ilike.%${s}%,city.ilike.%${s}%`
    );
  }
  if (filters?.city) query = query.eq("city", filters.city);
  if (filters?.dateFrom) query = query.gte("created_at", filters.dateFrom);
  if (filters?.dateTo) query = query.lte("created_at", filters.dateTo + "T23:59:59");

  const { data, error } = await query;

  if (error) {
    return { error: "حدث خطأ أثناء تحميل البيانات" };
  }

  const rows = (data ?? []) as Array<{
    national_id: string;
    full_name: string;
    phone: string;
    city: string;
    support_amount: number;
    notes: string | null;
    status: string;
    created_at: string;
  }>;

  if (rows.length === 0) {
    return { error: "لا توجد بيانات للتصدير" };
  }

  // Map to Arabic headers
  const STATUS_MAP: Record<string, string> = {
    active: "نشط",
    inactive: "غير نشط",
    archived: "مؤرشف",
  };

  const exportData = rows.map((r) => ({
    "رقم الهوية": r.national_id,
    "الاسم الكامل": r.full_name,
    "رقم الجوال": r.phone,
    "المدينة": r.city,
    "مبلغ الدعم": r.support_amount,
    "ملاحظات": r.notes ?? "",
    "الحالة": STATUS_MAP[r.status] || r.status,
    "تاريخ الإضافة": new Date(r.created_at).toLocaleDateString("ar-SA"),
  }));

  const ws = XLSX.utils.json_to_sheet(exportData);

  // Set column widths
  ws["!cols"] = [
    { wch: 14 }, // national_id
    { wch: 28 }, // full_name
    { wch: 14 }, // phone
    { wch: 16 }, // city
    { wch: 14 }, // support_amount
    { wch: 30 }, // notes
    { wch: 10 }, // status
    { wch: 16 }, // created_at
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "المستفيدين");

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  const base64 = Buffer.from(buf).toString("base64");

  const today = new Date().toISOString().split("T")[0];
  const fileName = `المستفيدين_${today}.xlsx`;

  // Audit log
  await insertAuditLog(supabase, {
    userId: session.userId,
    action: "export_beneficiaries",
    entityType: "beneficiaries",
    newData: { rows_exported: rows.length, filters },
  });

  return { base64, fileName };
}
