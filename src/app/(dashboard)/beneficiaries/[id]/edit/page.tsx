import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth/guard";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getBeneficiaryById } from "@/lib/db/beneficiaries";
import { updateBeneficiaryAction } from "@/lib/actions/beneficiaries";
import { BeneficiaryForm } from "@/components/beneficiary-form";
import Link from "next/link";
import type { Database } from "@/types/database";

type Beneficiary = Database["public"]["Tables"]["beneficiaries"]["Row"];

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditBeneficiaryPage({ params }: Props) {
  await requireAuth("staff");
  const { id } = await params;

  const supabase = await createServerSupabaseClient();
  const { data, error } = await getBeneficiaryById(supabase, id);

  if (error || !data) {
    notFound();
  }

  const beneficiary = data as Beneficiary;

  if (beneficiary.status === "archived") {
    return (
      <div className="max-w-2xl space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">لا يمكن التعديل</h1>
        <p className="text-gray-500">هذا المستفيد مؤرشف ولا يمكن تعديل بياناته.</p>
        <Link
          href={`/beneficiaries/${id}`}
          className="inline-block rounded-lg bg-gray-100 px-4 py-2 text-sm text-gray-700 hover:bg-gray-200 transition"
        >
          عرض البيانات
        </Link>
      </div>
    );
  }

  const boundAction = updateBeneficiaryAction.bind(null, id);

  return (
    <div className="max-w-2xl space-y-4">
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/beneficiaries" className="hover:text-gray-700">
            المستفيدين
          </Link>
          <span>/</span>
          <Link
            href={`/beneficiaries/${id}`}
            className="hover:text-gray-700"
          >
            {beneficiary.full_name}
          </Link>
          <span>/</span>
          <span className="text-gray-900">تعديل</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">
          تعديل بيانات المستفيد
        </h1>
      </div>

      <BeneficiaryForm
        action={boundAction}
        defaultValues={beneficiary}
        excludeId={id}
        submitLabel="حفظ التعديلات"
      />
    </div>
  );
}
