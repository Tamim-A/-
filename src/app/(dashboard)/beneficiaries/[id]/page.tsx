import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth/guard";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getBeneficiaryById } from "@/lib/db/beneficiaries";
import { STATUS_LABELS, FIELD_LABELS } from "@/lib/constants/labels";
import { canWrite } from "@/lib/auth/roles";
import Link from "next/link";
import type { Database } from "@/types/database";
import { ArchiveButton } from "./archive-button";

type Beneficiary = Database["public"]["Tables"]["beneficiaries"]["Row"];

interface Props {
  params: Promise<{ id: string }>;
}

export default async function BeneficiaryDetailPage({ params }: Props) {
  const session = await requireAuth();
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const { data, error } = await getBeneficiaryById(supabase, id);
  if (error || !data) notFound();

  const b = data as Beneficiary;
  const writable = canWrite(session.role);

  // Fetch creator / updater names
  const userIds = [b.created_by, b.updated_by].filter(Boolean) as string[];
  let userMap: Record<string, string> = {};
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", userIds);
    if (profiles) {
      userMap = Object.fromEntries(
        profiles.map((p) => [p.id, p.full_name])
      );
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/beneficiaries" className="hover:text-gray-700">
              المستفيدين
            </Link>
            <span>/</span>
            <span className="text-gray-900">{b.full_name}</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{b.full_name}</h1>
          <span
            className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
              b.status === "active"
                ? "bg-green-50 text-green-700"
                : b.status === "archived"
                ? "bg-gray-100 text-gray-500"
                : "bg-yellow-50 text-yellow-700"
            }`}
          >
            {STATUS_LABELS[b.status] || b.status}
          </span>
        </div>
        {writable && b.status !== "archived" && (
          <div className="flex items-center gap-2">
            <Link
              href={`/beneficiaries/${b.id}/edit`}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition"
            >
              تعديل
            </Link>
            <ArchiveButton id={b.id} name={b.full_name} />
          </div>
        )}
      </div>

      {/* Info cards */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-3 mb-4">
          البيانات الشخصية
        </h2>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <InfoRow label={FIELD_LABELS.national_id} value={b.national_id} dir="ltr" />
          <InfoRow label={FIELD_LABELS.full_name} value={b.full_name} />
          <InfoRow label={FIELD_LABELS.phone} value={b.phone} dir="ltr" />
          <InfoRow label={FIELD_LABELS.city} value={b.city} />
          <InfoRow
            label={FIELD_LABELS.support_amount}
            value={`${b.support_amount.toLocaleString("ar-SA")} ر.س`}
          />
          <InfoRow label={FIELD_LABELS.source} value={b.source === "manual" ? "إدخال يدوي" : b.source} />
        </dl>
      </div>

      {b.notes && (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-3 mb-4">
            {FIELD_LABELS.notes}
          </h2>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{b.notes}</p>
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-3 mb-4">
          معلومات السجل
        </h2>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <InfoRow
            label="تاريخ الإضافة"
            value={new Date(b.created_at).toLocaleString("ar-SA")}
            dir="ltr"
          />
          <InfoRow
            label="آخر تحديث"
            value={new Date(b.updated_at).toLocaleString("ar-SA")}
            dir="ltr"
          />
          <InfoRow
            label="أضيف بواسطة"
            value={b.created_by ? userMap[b.created_by] ?? "—" : "—"}
          />
          <InfoRow
            label="آخر تعديل بواسطة"
            value={b.updated_by ? userMap[b.updated_by] ?? "—" : "—"}
          />
          {b.archived_at && (
            <InfoRow
              label="تاريخ الأرشفة"
              value={new Date(b.archived_at).toLocaleString("ar-SA")}
              dir="ltr"
            />
          )}
        </dl>
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  dir,
}: {
  label: string;
  value: string;
  dir?: string;
}) {
  return (
    <div className="py-1">
      <dt className="text-xs text-gray-500 mb-0.5">{label}</dt>
      <dd className="text-sm font-medium text-gray-900" dir={dir}>
        {value || "—"}
      </dd>
    </div>
  );
}
