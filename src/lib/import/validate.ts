import { beneficiarySchema, type BeneficiaryFormData } from "@/lib/validations/beneficiary";
import { FIELD_LABELS } from "@/lib/constants/labels";
import type { RawRow } from "./parse";

export type RowStatus = "valid" | "invalid" | "duplicate" | "warning";

export interface ValidatedRow {
  rowNumber: number;
  status: RowStatus;
  data: BeneficiaryFormData | null;
  rawData: Record<string, unknown>;
  errors: string[];
  warnings: string[];
}

export interface ValidationSummary {
  total: number;
  valid: number;
  invalid: number;
  duplicate: number;
  warning: number;
}

/**
 * Validate parsed rows and detect intra-file duplicates.
 * Database duplicate checking happens server-side during import.
 */
export function validateRows(rows: RawRow[]): ValidatedRow[] {
  const seenNationalIds = new Map<string, number>(); // nationalId -> first rowNumber
  const seenPhones = new Map<string, number>();

  const results: ValidatedRow[] = [];

  for (const row of rows) {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Coerce support_amount to number
    const rawAmount = row.data.support_amount;
    const amount = typeof rawAmount === "string" ? Number(rawAmount) : rawAmount;

    // Coerce all string fields
    const rawData: Record<string, unknown> = {
      national_id: String(row.data.national_id ?? "").trim(),
      full_name: String(row.data.full_name ?? "").trim(),
      phone: String(row.data.phone ?? "").trim(),
      city: String(row.data.city ?? "").trim(),
      support_amount: amount,
      notes: row.data.notes ? String(row.data.notes).trim() : null,
    };

    // Validate with Zod schema
    const parsed = beneficiarySchema.safeParse(rawData);
    let data: BeneficiaryFormData | null = null;
    let status: RowStatus = "valid";

    if (!parsed.success) {
      status = "invalid";
      for (const issue of parsed.error.issues) {
        const field = String(issue.path[0]);
        const label = FIELD_LABELS[field] || field;
        errors.push(`${label}: ${issue.message}`);
      }
    } else {
      data = parsed.data;

      // Check intra-file duplicate national_id
      const nid = parsed.data.national_id;
      if (seenNationalIds.has(nid)) {
        status = "duplicate";
        errors.push(`رقم الهوية مكرر في الملف (الصف ${seenNationalIds.get(nid)})`);
      } else {
        seenNationalIds.set(nid, row.rowNumber);
      }

      // Check intra-file duplicate phone (warning only)
      const phone = parsed.data.phone;
      if (seenPhones.has(phone)) {
        warnings.push(`رقم الجوال مكرر في الملف (الصف ${seenPhones.get(phone)})`);
        if (status === "valid") status = "warning";
      } else {
        seenPhones.set(phone, row.rowNumber);
      }
    }

    results.push({
      rowNumber: row.rowNumber,
      status,
      data,
      rawData,
      errors,
      warnings,
    });
  }

  return results;
}

export function summarize(rows: ValidatedRow[]): ValidationSummary {
  return {
    total: rows.length,
    valid: rows.filter((r) => r.status === "valid" || r.status === "warning").length,
    invalid: rows.filter((r) => r.status === "invalid").length,
    duplicate: rows.filter((r) => r.status === "duplicate").length,
    warning: rows.filter((r) => r.status === "warning").length,
  };
}
