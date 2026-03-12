"use client";

import { useState, useTransition } from "react";
import { exportBeneficiariesAction } from "@/lib/actions/import-export";

export function ExportSection() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  const [status, setStatus] = useState<string>("");

  const handleExport = (statusFilter?: string) => {
    setError(undefined);
    startTransition(async () => {
      const filters = statusFilter ? { status: statusFilter } : undefined;
      const res = await exportBeneficiariesAction(filters);

      if (res.error) {
        setError(res.error);
        return;
      }

      if (res.base64 && res.fileName) {
        // Convert base64 to blob and download
        const binaryStr = atob(res.base64);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }
        const blob = new Blob([bytes], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = res.fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    });
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
        <h2 className="text-lg font-semibold text-gray-900">تصدير المستفيدين</h2>
      </div>

      <div className="p-6 space-y-4">
        <p className="text-sm text-gray-600">
          تصدير بيانات المستفيدين إلى ملف Excel مع عناوين عربية.
        </p>

        <div className="flex flex-wrap gap-3">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:border-blue-500 focus:outline-none"
          >
            <option value="">الكل (بدون المؤرشف)</option>
            <option value="active">النشطين فقط</option>
            <option value="inactive">غير النشطين فقط</option>
            <option value="archived">المؤرشفين فقط</option>
          </select>

          <button
            onClick={() => handleExport(status || undefined)}
            disabled={isPending}
            className="rounded-lg bg-green-600 px-6 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 transition flex items-center gap-2"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            {isPending ? "جاري التصدير..." : "تصدير إلى Excel"}
          </button>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
