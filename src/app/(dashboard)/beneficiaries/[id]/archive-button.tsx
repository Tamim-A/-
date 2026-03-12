"use client";

import { useState, useTransition } from "react";
import { archiveBeneficiaryAction } from "@/lib/actions/beneficiaries";

interface Props {
  id: string;
  name: string;
}

export function ArchiveButton({ id, name }: Props) {
  const [confirm, setConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>();

  const handleArchive = () => {
    startTransition(async () => {
      const result = await archiveBeneficiaryAction(id);
      if (result.error) {
        setError(result.error);
        setConfirm(false);
      }
    });
  };

  if (confirm) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-red-600">أرشفة {name}؟</span>
        <button
          onClick={handleArchive}
          disabled={isPending}
          className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50 transition"
        >
          {isPending ? "جاري..." : "تأكيد"}
        </button>
        <button
          onClick={() => setConfirm(false)}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 transition"
        >
          إلغاء
        </button>
        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirm(true)}
      className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition"
    >
      أرشفة
    </button>
  );
}
