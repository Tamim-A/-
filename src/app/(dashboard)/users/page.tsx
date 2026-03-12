import { requireAuth } from "@/lib/auth/guard";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ROLE_LABELS } from "@/lib/constants/labels";
import type { Database } from "@/types/database";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export default async function UsersPage() {
  await requireAuth("admin");

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  const profiles = data as Profile[] | null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">المستخدمين</h1>
        <p className="mt-1 text-sm text-gray-500">إدارة حسابات الموظفين والصلاحيات</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        {error ? (
          <div className="p-6 text-sm text-red-600">
            حدث خطأ في تحميل بيانات المستخدمين
          </div>
        ) : !profiles || profiles.length === 0 ? (
          <div className="p-6 text-sm text-gray-400">
            لا يوجد مستخدمين حالياً
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-4 py-3 text-right font-medium text-gray-600">الاسم</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">البريد الإلكتروني</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">الدور</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">الحالة</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">تاريخ الإنشاء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {profiles.map((profile) => (
                  <tr key={profile.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {profile.full_name || "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600" dir="ltr">
                      {profile.email}
                    </td>
                    <td className="px-4 py-3">
                      <RoleBadge role={profile.role} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge active={profile.is_active} />
                    </td>
                    <td className="px-4 py-3 text-gray-500" dir="ltr">
                      {new Date(profile.created_at).toLocaleDateString("ar-SA")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const colors: Record<string, string> = {
    admin: "bg-red-50 text-red-700",
    staff: "bg-blue-50 text-blue-700",
    viewer: "bg-gray-100 text-gray-600",
  };

  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[role] || colors.viewer}`}>
      {ROLE_LABELS[role] || role}
    </span>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
        active ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
      }`}
    >
      {active ? "نشط" : "معطل"}
    </span>
  );
}
