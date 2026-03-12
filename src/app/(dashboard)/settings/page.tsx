import { requireAuth } from "@/lib/auth/guard";
import { ROLE_LABELS } from "@/lib/constants/labels";

export default async function SettingsPage() {
  const session = await requireAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">الإعدادات</h1>
        <p className="mt-1 text-sm text-gray-500">إعدادات الحساب والنظام</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">معلومات الحساب</h2>
        <dl className="space-y-3">
          <div className="flex justify-between py-2 border-b border-gray-100">
            <dt className="text-sm text-gray-500">الاسم</dt>
            <dd className="text-sm font-medium text-gray-900">{session.fullName || "—"}</dd>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <dt className="text-sm text-gray-500">البريد الإلكتروني</dt>
            <dd className="text-sm font-medium text-gray-900" dir="ltr">{session.email}</dd>
          </div>
          <div className="flex justify-between py-2">
            <dt className="text-sm text-gray-500">الدور</dt>
            <dd className="text-sm font-medium text-gray-900">{ROLE_LABELS[session.role]}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
