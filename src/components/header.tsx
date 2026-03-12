"use client";

import { logoutAction } from "@/lib/auth/actions";
import { ROLE_LABELS } from "@/lib/constants/labels";
import type { UserRole } from "@/types/database";

interface HeaderProps {
  fullName: string;
  role: UserRole;
  onMenuToggle: () => void;
}

export function Header({ fullName, role, onMenuToggle }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 sm:px-6">
      <button
        onClick={onMenuToggle}
        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:hidden"
        aria-label="فتح القائمة"
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </button>

      <div className="flex-1" />

      <div className="flex items-center gap-4">
        <div className="text-left">
          <p className="text-sm font-medium text-gray-900">{fullName}</p>
          <p className="text-xs text-gray-500">{ROLE_LABELS[role]}</p>
        </div>

        <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center">
          <span className="text-sm font-bold text-blue-700">
            {fullName.charAt(0)}
          </span>
        </div>

        <form action={logoutAction}>
          <button
            type="submit"
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
            title="تسجيل الخروج"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
            </svg>
          </button>
        </form>
      </div>
    </header>
  );
}
