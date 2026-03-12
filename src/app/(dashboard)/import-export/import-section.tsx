"use client";

import { useState, useRef, useTransition } from "react";
import {
  previewImportAction,
  executeImportAction,
  type ImportPreviewResult,
  type ImportResult,
} from "@/lib/actions/import-export";
import { FIELD_LABELS } from "@/lib/constants/labels";

type Step = "upload" | "preview" | "importing" | "done";

export function ImportSection() {
  const [step, setStep] = useState<Step>("upload");
  const [preview, setPreview] = useState<ImportPreviewResult | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const [fileName, setFileName] = useState<string>();

  const handleUpload = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(undefined);
    const formData = new FormData(e.currentTarget);
    const file = formData.get("file") as File;
    if (!file || file.size === 0) {
      setError("الرجاء اختيار ملف");
      return;
    }
    setFileName(file.name);

    startTransition(async () => {
      const res = await previewImportAction(formData);
      if (res.error) {
        setError(res.error);
        return;
      }
      setPreview(res);
      setStep("preview");
    });
  };

  const handleImport = () => {
    if (!preview?.rows || !preview.fileName) return;

    setStep("importing");
    startTransition(async () => {
      const res = await executeImportAction(
        JSON.stringify(preview.rows),
        preview.fileName!
      );
      setResult(res);
      setStep("done");
    });
  };

  const reset = () => {
    setStep("upload");
    setPreview(null);
    setResult(null);
    setError(undefined);
    setFileName(undefined);
    formRef.current?.reset();
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
        <h2 className="text-lg font-semibold text-gray-900">استيراد المستفيدين</h2>
      </div>

      <div className="p-6 space-y-6">
        {/* Upload step */}
        {step === "upload" && (
          <>
            <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8">
              <form ref={formRef} onSubmit={handleUpload} className="text-center space-y-4">
                <svg className="mx-auto h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                </svg>
                <div>
                  <label className="cursor-pointer rounded-lg bg-white border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
                    اختر ملف
                    <input
                      type="file"
                      name="file"
                      accept=".xlsx,.csv,.xls"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) setFileName(f.name);
                      }}
                    />
                  </label>
                  {fileName && (
                    <p className="mt-2 text-sm text-gray-600">{fileName}</p>
                  )}
                </div>
                <p className="text-xs text-gray-400">
                  الصيغ المدعومة: xlsx, csv — الحد الأقصى: 5 ميجابايت / 5000 صف
                </p>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition"
                >
                  {isPending ? "جاري القراءة..." : "معاينة البيانات"}
                </button>
              </form>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Instructions */}
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 space-y-2">
              <h3 className="text-sm font-semibold text-blue-800">تعليمات الاستيراد</h3>
              <ul className="text-xs text-blue-700 space-y-1 list-disc mr-4">
                <li>يجب أن يحتوي الملف على صف عناوين (headers) في السطر الأول</li>
                <li>الأعمدة المطلوبة: {FIELD_LABELS.national_id}، {FIELD_LABELS.full_name}، {FIELD_LABELS.phone}، {FIELD_LABELS.city}، {FIELD_LABELS.support_amount}</li>
                <li>{FIELD_LABELS.notes} اختياري</li>
                <li>رقم الهوية يجب أن يكون 10 أرقام</li>
                <li>رقم الجوال يجب أن يبدأ بـ 05 ويتكون من 10 أرقام</li>
                <li>مبلغ الدعم يجب أن يكون رقم موجب</li>
                <li>سيتم رفض الصفوف ذات رقم هوية مكرر</li>
              </ul>
              <div className="pt-2">
                <p className="text-xs text-blue-600 font-medium">هيكل الملف المطلوب:</p>
                <div className="mt-1 overflow-x-auto">
                  <table className="text-xs border border-blue-200">
                    <thead>
                      <tr className="bg-blue-100">
                        <th className="border border-blue-200 px-2 py-1">رقم الهوية</th>
                        <th className="border border-blue-200 px-2 py-1">الاسم الكامل</th>
                        <th className="border border-blue-200 px-2 py-1">رقم الجوال</th>
                        <th className="border border-blue-200 px-2 py-1">المدينة</th>
                        <th className="border border-blue-200 px-2 py-1">مبلغ الدعم</th>
                        <th className="border border-blue-200 px-2 py-1">ملاحظات</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-blue-200 px-2 py-1" dir="ltr">1234567890</td>
                        <td className="border border-blue-200 px-2 py-1">أحمد محمد علي</td>
                        <td className="border border-blue-200 px-2 py-1" dir="ltr">0512345678</td>
                        <td className="border border-blue-200 px-2 py-1">الرياض</td>
                        <td className="border border-blue-200 px-2 py-1" dir="ltr">1500</td>
                        <td className="border border-blue-200 px-2 py-1">—</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Preview step */}
        {step === "preview" && preview && (
          <>
            {/* Summary */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <SummaryCard label="إجمالي الصفوف" value={preview.summary!.total} color="text-gray-900" bg="bg-gray-50" />
              <SummaryCard label="صالح للاستيراد" value={preview.summary!.valid} color="text-green-700" bg="bg-green-50" />
              <SummaryCard label="غير صالح" value={preview.summary!.invalid} color="text-red-700" bg="bg-red-50" />
              <SummaryCard label="مكرر (في الملف)" value={preview.summary!.duplicate} color="text-amber-700" bg="bg-amber-50" />
            </div>

            {/* Preview table */}
            <div className="overflow-x-auto max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-gray-50">
                  <tr className="border-b border-gray-200">
                    <th className="px-3 py-2 text-right font-medium text-gray-600">صف</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-600">الحالة</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-600">رقم الهوية</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-600">الاسم</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-600">الجوال</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-600">المدينة</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-600">المبلغ</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-600">ملاحظات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {preview.rows!.map((row) => (
                    <tr
                      key={row.rowNumber}
                      className={
                        row.status === "invalid" || row.status === "duplicate"
                          ? "bg-red-50/50"
                          : row.status === "warning"
                          ? "bg-amber-50/50"
                          : ""
                      }
                    >
                      <td className="px-3 py-2 text-gray-500">{row.rowNumber}</td>
                      <td className="px-3 py-2">
                        <StatusBadge status={row.status} />
                        {row.errors.length > 0 && (
                          <div className="mt-1 space-y-0.5">
                            {row.errors.map((e, i) => (
                              <p key={i} className="text-red-600 text-[10px]">{e}</p>
                            ))}
                          </div>
                        )}
                        {row.warnings.length > 0 && (
                          <div className="mt-1 space-y-0.5">
                            {row.warnings.map((w, i) => (
                              <p key={i} className="text-amber-600 text-[10px]">{w}</p>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2 font-mono" dir="ltr">{String(row.rawData.national_id ?? "")}</td>
                      <td className="px-3 py-2">{String(row.rawData.full_name ?? "")}</td>
                      <td className="px-3 py-2" dir="ltr">{String(row.rawData.phone ?? "")}</td>
                      <td className="px-3 py-2">{String(row.rawData.city ?? "")}</td>
                      <td className="px-3 py-2" dir="ltr">{String(row.rawData.support_amount ?? "")}</td>
                      <td className="px-3 py-2 text-gray-500 max-w-[120px] truncate">{String(row.rawData.notes ?? "")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              {preview.summary!.valid > 0 && (
                <button
                  onClick={handleImport}
                  disabled={isPending}
                  className="rounded-lg bg-green-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 transition"
                >
                  {isPending ? "جاري الاستيراد..." : `استيراد ${preview.summary!.valid} صف صالح`}
                </button>
              )}
              <button
                onClick={reset}
                className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition"
              >
                إلغاء
              </button>
            </div>
          </>
        )}

        {/* Importing step */}
        {step === "importing" && (
          <div className="py-12 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
            <p className="mt-4 text-sm text-gray-600">جاري استيراد البيانات...</p>
          </div>
        )}

        {/* Done step */}
        {step === "done" && result && (
          <>
            {result.error && !result.success ? (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {result.error}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3">
                  <p className="text-sm font-medium text-green-800">
                    تم الاستيراد بنجاح — {result.inserted} سجل
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <SummaryCard label="تم الإدخال" value={result.inserted} color="text-green-700" bg="bg-green-50" />
                  <SummaryCard label="فشل" value={result.failed} color="text-red-700" bg="bg-red-50" />
                  <SummaryCard label="مكرر في قاعدة البيانات" value={result.duplicateDb} color="text-amber-700" bg="bg-amber-50" />
                </div>

                {result.rowErrors.length > 0 && (
                  <div className="rounded-lg border border-gray-200 p-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">
                      الصفوف التي لم يتم إدخالها
                    </h3>
                    <div className="max-h-48 overflow-y-auto space-y-1">
                      {result.rowErrors.map((re, i) => (
                        <p key={i} className="text-xs text-red-600">
                          صف {re.rowNumber}: {re.error}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={reset}
              className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition"
            >
              استيراد ملف آخر
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  color,
  bg,
}: {
  label: string;
  value: number;
  color: string;
  bg: string;
}) {
  return (
    <div className={`rounded-lg ${bg} p-3 text-center`}>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-gray-600 mt-0.5">{label}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    valid: "bg-green-100 text-green-700",
    invalid: "bg-red-100 text-red-700",
    duplicate: "bg-amber-100 text-amber-700",
    warning: "bg-yellow-100 text-yellow-700",
  };
  const labels: Record<string, string> = {
    valid: "صالح",
    invalid: "غير صالح",
    duplicate: "مكرر",
    warning: "تحذير",
  };

  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${styles[status] || styles.invalid}`}>
      {labels[status] || status}
    </span>
  );
}
