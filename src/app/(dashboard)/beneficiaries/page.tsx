import { requireAuth } from "@/lib/auth/guard";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { listBeneficiaries, getDistinctCities } from "@/lib/db/beneficiaries";
import { STATUS_LABELS } from "@/lib/constants/labels";
import { canWrite } from "@/lib/auth/roles";
import Link from "next/link";
import type { BeneficiaryStatus, Database } from "@/types/database";
import { BeneficiaryFilters } from "./filters";
import { ExportButton } from "./export-button";

type Beneficiary = Database["public"]["Tables"]["beneficiaries"]["Row"];

interface PageProps {
  searchParams: Promise<{
    search?: string;
    status?: string;
    city?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: string;
  }>;
}

export default async function BeneficiariesPage({ searchParams }: PageProps) {
  const session = await requireAuth();
  const supabase = await createServerSupabaseClient();
  const params = await searchParams;

  const page = Math.max(1, Number(params.page) || 1);
  const pageSize = 20;

  const status = params.status as BeneficiaryStatus | undefined;
  const search = params.search?.trim() || undefined;
  const city = params.city || undefined;
  const dateFrom = params.dateFrom || undefined;
  const dateTo = params.dateTo || undefined;

  const [{ data, count, error }, cities] = await Promise.all([
    listBeneficiaries(supabase, { status, search, city, dateFrom, dateTo, page, pageSize }),
    getDistinctCities(supabase),
  ]);

  const beneficiaries = (data ?? []) as Beneficiary[];
  const totalCount = count ?? 0;
  const totalPages = Math.ceil(totalCount / pageSize);
  const writable = canWrite(session.role);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">المستفيدين</h1>
          <p className="mt-1 text-sm text-gray-500">
            إجمالي {totalCount} مستفيد
          </p>
        </div>
        <div className="flex items-center gap-2">
          {writable && (
            <ExportButton filters={{ status: params.status, search: params.search, city: params.city, dateFrom: params.dateFrom, dateTo: params.dateTo }} />
          )}
          {writable && (
            <Link
              href="/beneficiaries/new"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition"
            >
              + إضافة مستفيد
            </Link>
          )}
        </div>
      </div>

      <BeneficiaryFilters cities={cities} />

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        {error ? (
          <div className="p-6 text-sm text-red-600">حدث خطأ في تحميل البيانات</div>
        ) : beneficiaries.length === 0 ? (
          <div className="p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
            </svg>
            <h3 className="mt-4 text-sm font-medium text-gray-900">لا توجد نتائج</h3>
            <p className="mt-1 text-sm text-gray-400">
              {search || city || status
                ? "حاول تعديل معايير البحث"
                : "لم يتم إضافة مستفيدين بعد"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-4 py-3 text-right font-medium text-gray-600">رقم الهوية</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">الاسم الكامل</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">الجوال</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">المدينة</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">مبلغ الدعم</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">الحالة</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">تاريخ الإضافة</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {beneficiaries.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-mono text-gray-900" dir="ltr">
                      {b.national_id}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {b.full_name}
                    </td>
                    <td className="px-4 py-3 text-gray-600" dir="ltr">
                      {b.phone}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{b.city}</td>
                    <td className="px-4 py-3 text-gray-900 font-medium" dir="ltr">
                      {b.support_amount.toLocaleString("ar-SA")} ر.س
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          b.status === "active"
                            ? "bg-green-50 text-green-700"
                            : b.status === "archived"
                            ? "bg-gray-100 text-gray-500"
                            : "bg-yellow-50 text-yellow-700"
                        }`}
                      >
                        {STATUS_LABELS[b.status] || b.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500" dir="ltr">
                      {new Date(b.created_at).toLocaleDateString("ar-SA")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/beneficiaries/${b.id}`}
                          className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                        >
                          عرض
                        </Link>
                        {writable && b.status !== "archived" && (
                          <Link
                            href={`/beneficiaries/${b.id}/edit`}
                            className="text-gray-500 hover:text-gray-700 text-xs font-medium"
                          >
                            تعديل
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {page > 1 && (
            <PaginationLink page={page - 1} params={params} label="السابق" />
          )}
          <span className="px-3 py-2 text-sm text-gray-600">
            صفحة {page} من {totalPages}
          </span>
          {page < totalPages && (
            <PaginationLink page={page + 1} params={params} label="التالي" />
          )}
        </div>
      )}
    </div>
  );
}

function PaginationLink({
  page,
  params,
  label,
}: {
  page: number;
  params: Record<string, string | undefined>;
  label: string;
}) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v && k !== "page") sp.set(k, v);
  }
  sp.set("page", String(page));

  return (
    <Link
      href={`/beneficiaries?${sp.toString()}`}
      className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
    >
      {label}
    </Link>
  );
}
