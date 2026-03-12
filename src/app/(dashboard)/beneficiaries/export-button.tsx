"use client";

import { useTransition } from "react";
import { exportBeneficiariesAction } from "@/lib/actions/import-export";

interface Props {
  filters?: {
    status?: string;
    search?: string;
    city?: string;
    dateFrom?: string;
    dateTo?: string;
  };
}

export function ExportButton({ filters }: Props) {
  const [isPending, startTransition] = useTransition();

  const handleExport = () => {
    startTransition(async () => {
      const cleaned: Record<string, string> = {};
      if (filters) {
        for (const [k, v] of Object.entries(filters)) {
          if (v) cleaned[k] = v;
        }
      }
      const res = await exportBeneficiariesAction(
        Object.keys(cleaned).length > 0 ? cleaned : undefined
      );

      if (res.error) {
        alert(res.error);
        return;
      }

      if (res.base64 && res.fileName) {
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
    <button
      onClick={handleExport}
      disabled={isPending}
      className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition flex items-center gap-1.5"
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
      </svg>
      {isPending ? "جاري التصدير..." : "تصدير"}
    </button>
  );
}
