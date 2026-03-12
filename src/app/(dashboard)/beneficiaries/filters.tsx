"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";

interface Props {
  cities: string[];
}

export function BeneficiaryFilters({ cities }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");

  const applyFilters = useCallback(
    (overrides: Record<string, string>) => {
      const sp = new URLSearchParams(searchParams.toString());
      sp.delete("page"); // reset pagination on filter change
      for (const [k, v] of Object.entries(overrides)) {
        if (v) {
          sp.set(k, v);
        } else {
          sp.delete(k);
        }
      }
      router.push(`/beneficiaries?${sp.toString()}`);
    },
    [router, searchParams]
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters({ search });
  };

  const clearAll = () => {
    setSearch("");
    router.push("/beneficiaries");
  };

  const hasFilters =
    searchParams.get("search") ||
    searchParams.get("status") ||
    searchParams.get("city") ||
    searchParams.get("dateFrom") ||
    searchParams.get("dateTo");

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="بحث بالاسم، رقم الهوية، الجوال، أو المدينة..."
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition"
        >
          بحث
        </button>
      </form>

      {/* Filters row */}
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs text-gray-500 mb-1">الحالة</label>
          <select
            value={searchParams.get("status") ?? ""}
            onChange={(e) => applyFilters({ status: e.target.value })}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:border-blue-500 focus:outline-none"
          >
            <option value="">الكل (بدون المؤرشف)</option>
            <option value="active">نشط</option>
            <option value="inactive">غير نشط</option>
            <option value="archived">مؤرشف</option>
          </select>
        </div>

        {cities.length > 0 && (
          <div>
            <label className="block text-xs text-gray-500 mb-1">المدينة</label>
            <select
              value={searchParams.get("city") ?? ""}
              onChange={(e) => applyFilters({ city: e.target.value })}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:border-blue-500 focus:outline-none"
            >
              <option value="">جميع المدن</option>
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-xs text-gray-500 mb-1">من تاريخ</label>
          <input
            type="date"
            value={searchParams.get("dateFrom") ?? ""}
            onChange={(e) => applyFilters({ dateFrom: e.target.value })}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">إلى تاريخ</label>
          <input
            type="date"
            value={searchParams.get("dateTo") ?? ""}
            onChange={(e) => applyFilters({ dateTo: e.target.value })}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:border-blue-500 focus:outline-none"
          />
        </div>

        {hasFilters && (
          <button
            onClick={clearAll}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 transition"
          >
            مسح الفلاتر
          </button>
        )}
      </div>
    </div>
  );
}
