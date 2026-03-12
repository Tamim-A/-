"use client";

import { useActionState, useState, useTransition } from "react";
import { FIELD_LABELS } from "@/lib/constants/labels";
import {
  checkDuplicatesAction,
  type BeneficiaryActionResult,
  type DuplicateWarning,
} from "@/lib/actions/beneficiaries";
import type { Database } from "@/types/database";

type Beneficiary = Database["public"]["Tables"]["beneficiaries"]["Row"];

interface Props {
  action: (
    prev: BeneficiaryActionResult,
    formData: FormData
  ) => Promise<BeneficiaryActionResult>;
  defaultValues?: Partial<Beneficiary>;
  excludeId?: string;
  submitLabel: string;
}

export function BeneficiaryForm({
  action,
  defaultValues,
  excludeId,
  submitLabel,
}: Props) {
  const [state, formAction, isSubmitting] = useActionState(action, {});
  const [warnings, setWarnings] = useState<DuplicateWarning[]>([]);
  const [acknowledged, setAcknowledged] = useState(false);
  const [checking, startCheck] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    // If warnings exist and user acknowledged, let form submit normally
    if (warnings.length > 0 && acknowledged) {
      return; // Let form action proceed
    }

    // If there were no warnings yet, check for duplicates first
    if (warnings.length === 0) {
      e.preventDefault();
      const form = e.currentTarget;
      const formData = new FormData(form);

      startCheck(async () => {
        const result = await checkDuplicatesAction(formData, excludeId);
        if (result.error) {
          // Hard block — show as state error
          // Re-submit to get the error through action state
          form.requestSubmit();
          return;
        }
        if (result.warnings && result.warnings.length > 0) {
          setWarnings(result.warnings);
          return;
        }
        // No duplicates — submit normally
        form.requestSubmit();
      });
    }
  };

  const fieldError = (name: string) => state.fieldErrors?.[name];

  return (
    <form action={formAction} onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-5">
        <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-3">
          البيانات الأساسية
        </h2>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field
            name="national_id"
            label={FIELD_LABELS.national_id}
            defaultValue={defaultValues?.national_id}
            error={fieldError("national_id")}
            required
            dir="ltr"
            placeholder="1234567890"
            maxLength={10}
          />
          <Field
            name="full_name"
            label={FIELD_LABELS.full_name}
            defaultValue={defaultValues?.full_name}
            error={fieldError("full_name")}
            required
          />
          <Field
            name="phone"
            label={FIELD_LABELS.phone}
            defaultValue={defaultValues?.phone}
            error={fieldError("phone")}
            required
            dir="ltr"
            placeholder="05xxxxxxxx"
            maxLength={10}
          />
          <Field
            name="city"
            label={FIELD_LABELS.city}
            defaultValue={defaultValues?.city}
            error={fieldError("city")}
            required
          />
          <Field
            name="support_amount"
            label={FIELD_LABELS.support_amount}
            type="number"
            defaultValue={defaultValues?.support_amount?.toString()}
            error={fieldError("support_amount")}
            required
            dir="ltr"
            min="0.01"
            step="0.01"
          />
        </div>

        <div>
          <label
            htmlFor="notes"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {FIELD_LABELS.notes}{" "}
            <span className="text-gray-400 font-normal">(اختياري)</span>
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            defaultValue={defaultValues?.notes ?? ""}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition resize-none"
          />
        </div>
      </div>

      {/* Duplicate warnings */}
      {warnings.length > 0 && !acknowledged && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 space-y-3">
          <h3 className="text-sm font-semibold text-amber-800 flex items-center gap-2">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
            تحذيرات تكرار محتمل
          </h3>
          {warnings.map((w, i) => (
            <div key={i} className="text-sm text-amber-700 space-y-1">
              <p className="font-medium">{w.message}</p>
              <ul className="mr-4 list-disc space-y-0.5">
                {w.records.map((r) => (
                  <li key={r.id}>
                    {r.full_name}
                    {r.national_id && (
                      <span className="text-amber-600" dir="ltr">
                        {" "}
                        ({r.national_id})
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setAcknowledged(true)}
              className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 transition"
            >
              متابعة على أي حال
            </button>
            <button
              type="button"
              onClick={() => setWarnings([])}
              className="rounded-lg border border-amber-300 px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100 transition"
            >
              تعديل البيانات
            </button>
          </div>
        </div>
      )}

      {/* Global error */}
      {state.error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      {/* Submit */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isSubmitting || checking || (warnings.length > 0 && !acknowledged)}
          className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500/20 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {isSubmitting || checking ? "جاري الحفظ..." : submitLabel}
        </button>
        <a
          href="/beneficiaries"
          className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition"
        >
          إلغاء
        </a>
      </div>
    </form>
  );
}

function Field({
  name,
  label,
  type = "text",
  defaultValue,
  error,
  required,
  dir,
  placeholder,
  maxLength,
  min,
  step,
}: {
  name: string;
  label: string;
  type?: string;
  defaultValue?: string;
  error?: string;
  required?: boolean;
  dir?: string;
  placeholder?: string;
  maxLength?: number;
  min?: string;
  step?: string;
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        {label}
        {required && <span className="text-red-500 mr-0.5">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue ?? ""}
        dir={dir}
        placeholder={placeholder}
        maxLength={maxLength}
        min={min}
        step={step}
        className={`block w-full rounded-lg border px-3 py-2.5 text-sm transition focus:outline-none focus:ring-2 ${
          error
            ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
            : "border-gray-300 focus:border-blue-500 focus:ring-blue-500/20"
        }`}
      />
      {error && (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}
