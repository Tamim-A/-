import { requireAuth } from "@/lib/auth/guard";
import { createBeneficiaryAction } from "@/lib/actions/beneficiaries";
import { BeneficiaryForm } from "@/components/beneficiary-form";
import Link from "next/link";

export default async function NewBeneficiaryPage() {
  await requireAuth("staff");

  return (
    <div className="max-w-2xl space-y-4">
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/beneficiaries" className="hover:text-gray-700">
            المستفيدين
          </Link>
          <span>/</span>
          <span className="text-gray-900">إضافة مستفيد جديد</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">إضافة مستفيد جديد</h1>
      </div>

      <BeneficiaryForm
        action={createBeneficiaryAction}
        submitLabel="حفظ المستفيد"
      />
    </div>
  );
}
