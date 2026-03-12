/**
 * Arabic-first UI labels and constants.
 * Used across the application for consistent bilingual display.
 */

export const ROLE_LABELS: Record<string, string> = {
  admin: "مدير النظام",
  staff: "موظف",
  viewer: "مشاهد",
};

export const STATUS_LABELS: Record<string, string> = {
  active: "نشط",
  inactive: "غير نشط",
  archived: "مؤرشف",
};

export const ACTION_LABELS: Record<string, string> = {
  create_beneficiary: "إضافة مستفيد",
  update_beneficiary: "تعديل مستفيد",
  archive_beneficiary: "أرشفة مستفيد",
  import_beneficiaries: "استيراد مستفيدين",
  export_beneficiaries: "تصدير مستفيدين",
  create_user: "إضافة مستخدم",
  update_user: "تعديل مستخدم",
};

export const FIELD_LABELS: Record<string, string> = {
  national_id: "رقم الهوية",
  full_name: "الاسم الكامل",
  phone: "رقم الجوال",
  city: "المدينة",
  support_amount: "مبلغ الدعم",
  notes: "ملاحظات",
  status: "الحالة",
  source: "المصدر",
  email: "البريد الإلكتروني",
  role: "الدور",
};

export const APP_NAME = "نظام إدارة المستفيدين";
