"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/guard";
import { beneficiarySchema } from "@/lib/validations/beneficiary";
import {
  createBeneficiary,
  updateBeneficiary,
  archiveBeneficiary,
  checkDuplicateNationalId,
  checkDuplicatePhone,
  checkSimilarNameCity,
} from "@/lib/db/beneficiaries";
import type { Database } from "@/types/database";

type Beneficiary = Database["public"]["Tables"]["beneficiaries"]["Row"];
type DupRecord = { id: string; full_name: string; national_id?: string; phone?: string; city?: string; status: string };

export interface DuplicateWarning {
  type: "national_id" | "phone" | "name_city";
  message: string;
  records: Array<{ id: string; full_name: string; national_id?: string }>;
}

export interface BeneficiaryActionResult {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  warnings?: DuplicateWarning[];
  id?: string;
}

function parseFormData(formData: FormData) {
  return {
    national_id: formData.get("national_id") as string,
    full_name: formData.get("full_name") as string,
    phone: formData.get("phone") as string,
    city: formData.get("city") as string,
    support_amount: Number(formData.get("support_amount")),
    notes: (formData.get("notes") as string) || null,
  };
}

export async function checkDuplicatesAction(
  formData: FormData,
  excludeId?: string
): Promise<BeneficiaryActionResult> {
  const session = await requireAuth("staff");
  const supabase = await createServerSupabaseClient();

  const raw = parseFormData(formData);
  const parsed = beneficiarySchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0]);
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { fieldErrors };
  }

  const warnings: DuplicateWarning[] = [];

  // Hard block: duplicate national_id
  const { data: nidRaw } = await checkDuplicateNationalId(
    supabase,
    parsed.data.national_id,
    excludeId
  );
  const nidDups = (nidRaw ?? []) as DupRecord[];
  if (nidDups.length > 0) {
    return {
      error: `رقم الهوية ${parsed.data.national_id} مسجل مسبقاً باسم "${nidDups[0].full_name}"`,
    };
  }

  // Soft warning: duplicate phone
  const { data: phoneRaw } = await checkDuplicatePhone(
    supabase,
    parsed.data.phone,
    excludeId
  );
  const phoneDups = (phoneRaw ?? []) as DupRecord[];
  if (phoneDups.length > 0) {
    warnings.push({
      type: "phone",
      message: `رقم الجوال ${parsed.data.phone} مسجل لمستفيد آخر`,
      records: phoneDups.map((r) => ({
        id: r.id,
        full_name: r.full_name,
        national_id: r.national_id,
      })),
    });
  }

  // Soft warning: similar name + city
  const { data: nameRaw } = await checkSimilarNameCity(
    supabase,
    parsed.data.full_name,
    parsed.data.city,
    excludeId
  );
  const nameDups = (nameRaw ?? []) as DupRecord[];
  if (nameDups.length > 0) {
    warnings.push({
      type: "name_city",
      message: `يوجد مستفيد بنفس الاسم أو اسم مشابه في نفس المدينة`,
      records: nameDups.map((r) => ({
        id: r.id,
        full_name: r.full_name,
        national_id: r.national_id,
      })),
    });
  }

  if (warnings.length > 0) {
    return { warnings };
  }

  return { success: true };
}

export async function createBeneficiaryAction(
  _prev: BeneficiaryActionResult,
  formData: FormData
): Promise<BeneficiaryActionResult> {
  const session = await requireAuth("staff");
  const supabase = await createServerSupabaseClient();

  const raw = parseFormData(formData);
  const parsed = beneficiarySchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0]);
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { fieldErrors };
  }

  // Hard block on duplicate national_id
  const { data: nidRaw2 } = await checkDuplicateNationalId(
    supabase,
    parsed.data.national_id
  );
  const nidDups2 = (nidRaw2 ?? []) as DupRecord[];
  if (nidDups2.length > 0) {
    return {
      error: `رقم الهوية ${parsed.data.national_id} مسجل مسبقاً باسم "${nidDups2[0].full_name}"`,
    };
  }

  const { data, error } = await createBeneficiary(supabase, {
    ...parsed.data,
    source: "manual",
    created_by: session.userId,
    updated_by: session.userId,
  });

  if (error || !data) {
    return { error: "حدث خطأ أثناء حفظ بيانات المستفيد" };
  }

  const created = data as Beneficiary;
  revalidatePath("/beneficiaries");
  redirect(`/beneficiaries/${created.id}`);
}

export async function updateBeneficiaryAction(
  id: string,
  _prev: BeneficiaryActionResult,
  formData: FormData
): Promise<BeneficiaryActionResult> {
  const session = await requireAuth("staff");
  const supabase = await createServerSupabaseClient();

  const raw = parseFormData(formData);
  const parsed = beneficiarySchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0]);
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { fieldErrors };
  }

  // Hard block on duplicate national_id (exclude self)
  const { data: nidRaw3 } = await checkDuplicateNationalId(
    supabase,
    parsed.data.national_id,
    id
  );
  const nidDups3 = (nidRaw3 ?? []) as DupRecord[];
  if (nidDups3.length > 0) {
    return {
      error: `رقم الهوية ${parsed.data.national_id} مسجل مسبقاً باسم "${nidDups3[0].full_name}"`,
    };
  }

  const { error } = await updateBeneficiary(supabase, id, {
    ...parsed.data,
    updated_by: session.userId,
  });

  if (error) {
    return { error: "حدث خطأ أثناء تحديث بيانات المستفيد" };
  }

  revalidatePath("/beneficiaries");
  revalidatePath(`/beneficiaries/${id}`);
  redirect(`/beneficiaries/${id}`);
}

export async function archiveBeneficiaryAction(
  id: string
): Promise<BeneficiaryActionResult> {
  const session = await requireAuth("staff");
  const supabase = await createServerSupabaseClient();

  const { error } = await archiveBeneficiary(supabase, id, session.userId);

  if (error) {
    return { error: "حدث خطأ أثناء أرشفة المستفيد" };
  }

  revalidatePath("/beneficiaries");
  redirect("/beneficiaries");
}
