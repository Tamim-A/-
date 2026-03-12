import { requireAuth } from "@/lib/auth/guard";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  getDashboardStats,
  getBeneficiariesByCity,
  getMonthlyTrend,
  getRecentBeneficiaries,
  getRecentImports,
  getRecentAuditLogs,
} from "@/lib/db/dashboard";
import { ACTION_LABELS } from "@/lib/constants/labels";
import { BarChart, HorizontalBarChart } from "@/components/charts";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await requireAuth();
  const supabase = await createServerSupabaseClient();

  const [stats, cityData, monthlyTrend, recentBeneficiaries, recentImports, recentAudit] =
    await Promise.all([
      getDashboardStats(supabase),
      getBeneficiariesByCity(supabase),
      getMonthlyTrend(supabase, 6),
      getRecentBeneficiaries(supabase, 5),
      getRecentImports(supabase, 5),
      getRecentAuditLogs(supabase, 8),
    ]);

  const fmt = (n: number) => n.toLocaleString("ar-SA");
  const fmtCurrency = (n: number) => `${n.toLocaleString("ar-SA")} ر.س`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">لوحة التحكم</h1>
        <p className="mt-1 text-sm text-gray-500">مرحباً، {session.fullName}</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          label="إجمالي المستفيدين"
          value={fmt(stats.totalBeneficiaries)}
          icon={<UsersIcon className="h-6 w-6 text-blue-600" />}
          bg="bg-blue-50"
        />
        <StatCard
          label="إجمالي مبالغ الدعم"
          value={fmtCurrency(stats.totalSupport)}
          icon={<CurrencyIcon className="h-6 w-6 text-green-600" />}
          bg="bg-green-50"
        />
        <StatCard
          label="هذا الشهر"
          value={fmt(stats.addedThisMonth)}
          icon={<CalendarIcon className="h-6 w-6 text-purple-600" />}
          bg="bg-purple-50"
          sub="مستفيد جديد"
        />
        <StatCard
          label="هذا الربع"
          value={fmt(stats.addedThisQuarter)}
          icon={<ChartIcon className="h-6 w-6 text-amber-600" />}
          bg="bg-amber-50"
          sub="مستفيد جديد"
        />
        <StatCard
          label="هذا العام"
          value={fmt(stats.addedThisYear)}
          icon={<TrendIcon className="h-6 w-6 text-teal-600" />}
          bg="bg-teal-50"
          sub="مستفيد جديد"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <BarChart
          title="المستفيدين حسب الشهر (آخر 6 أشهر)"
          data={monthlyTrend.map((m) => ({ label: m.label, value: m.count }))}
          color="bg-blue-500"
        />
        <BarChart
          title="مبالغ الدعم حسب الشهر (آخر 6 أشهر)"
          data={monthlyTrend.map((m) => ({ label: m.label, value: m.totalSupport }))}
          color="bg-green-500"
          formatValue={fmtCurrency}
        />
      </div>

      {/* City charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <HorizontalBarChart
          title="أعلى المدن بعدد المستفيدين"
          data={cityData.map((c) => ({ label: c.city, value: c.count }))}
          color="bg-blue-500"
          formatValue={(v) => `${fmt(v)} مستفيد`}
        />
        <HorizontalBarChart
          title="أعلى المدن بمبالغ الدعم"
          data={[...cityData].sort((a, b) => b.totalSupport - a.totalSupport).map((c) => ({
            label: c.city,
            value: c.totalSupport,
          }))}
          color="bg-green-500"
          formatValue={fmtCurrency}
        />
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent beneficiaries */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">آخر المستفيدين</h3>
            <Link href="/beneficiaries" className="text-xs text-blue-600 hover:text-blue-800">
              عرض الكل
            </Link>
          </div>
          {recentBeneficiaries.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">لا يوجد مستفيدين</p>
          ) : (
            <div className="space-y-3">
              {recentBeneficiaries.map((b) => (
                <Link
                  key={b.id}
                  href={`/beneficiaries/${b.id}`}
                  className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0 hover:bg-gray-50 -mx-2 px-2 rounded transition"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{b.full_name}</p>
                    <p className="text-xs text-gray-500">{b.city}</p>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900" dir="ltr">
                      {fmtCurrency(b.support_amount)}
                    </p>
                    <p className="text-[10px] text-gray-400" dir="ltr">
                      {new Date(b.created_at).toLocaleDateString("ar-SA")}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent imports */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">آخر عمليات الاستيراد</h3>
            <Link href="/import-export" className="text-xs text-blue-600 hover:text-blue-800">
              استيراد
            </Link>
          </div>
          {recentImports.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">لا توجد عمليات استيراد</p>
          ) : (
            <div className="space-y-3">
              {recentImports.map((imp) => (
                <div key={imp.id} className="py-2 border-b border-gray-50 last:border-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{imp.file_name}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-green-600">{imp.success_rows} نجح</span>
                    {imp.failed_rows > 0 && (
                      <span className="text-xs text-red-500">{imp.failed_rows} فشل</span>
                    )}
                    {imp.duplicate_rows > 0 && (
                      <span className="text-xs text-amber-500">{imp.duplicate_rows} مكرر</span>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-400 mt-0.5" dir="ltr">
                    {new Date(imp.imported_at).toLocaleString("ar-SA")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent audit */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">سجل العمليات</h3>
          {recentAudit.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">لا توجد عمليات</p>
          ) : (
            <div className="space-y-2.5">
              {recentAudit.map((log) => (
                <div key={log.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                  <span className="text-xs font-medium text-gray-700">
                    {ACTION_LABELS[log.action] || log.action}
                  </span>
                  <span className="text-[10px] text-gray-400" dir="ltr">
                    {new Date(log.created_at).toLocaleString("ar-SA")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Reporting summary */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">ملخص التقارير</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <ReportCard
            title="الشهر الحالي"
            count={stats.addedThisMonth}
            total={stats.totalBeneficiaries}
          />
          <ReportCard
            title="الربع الحالي"
            count={stats.addedThisQuarter}
            total={stats.totalBeneficiaries}
          />
          <ReportCard
            title="العام الحالي"
            count={stats.addedThisYear}
            total={stats.totalBeneficiaries}
          />
        </div>
      </div>
    </div>
  );
}

function ReportCard({
  title,
  count,
  total,
}: {
  title: string;
  count: number;
  total: number;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="rounded-lg bg-gray-50 p-4 text-center">
      <p className="text-xs text-gray-500 mb-1">{title}</p>
      <p className="text-2xl font-bold text-gray-900">{count.toLocaleString("ar-SA")}</p>
      <p className="text-xs text-gray-400 mt-1">مستفيد جديد</p>
      <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 rounded-full"
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <p className="text-[10px] text-gray-400 mt-1">{pct}% من الإجمالي</p>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  bg,
  sub,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  bg: string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${bg} shrink-0`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-lg font-bold text-gray-900 truncate">{value}</p>
          <p className="text-xs text-gray-500">{label}</p>
          {sub && <p className="text-[10px] text-gray-400">{sub}</p>}
        </div>
      </div>
    </div>
  );
}

// --- Icons ---

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
    </svg>
  );
}

function CurrencyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
    </svg>
  );
}

function ChartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
    </svg>
  );
}

function TrendIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
    </svg>
  );
}
