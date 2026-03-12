"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { APP_NAME } from "@/lib/constants/labels";
import type { UserRole } from "@/types/database";

interface AppShellProps {
  children: React.ReactNode;
  fullName: string;
  role: UserRole;
}

export function AppShell({ children, fullName, role }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — mobile (slide-over) */}
      <aside
        className={`fixed inset-y-0 right-0 z-50 w-64 transform bg-white border-l border-gray-200 transition-transform duration-200 lg:hidden ${
          sidebarOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4">
          <span className="text-sm font-bold text-gray-900">{APP_NAME}</span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <Sidebar role={role} onClose={() => setSidebarOpen(false)} />
      </aside>

      {/* Sidebar — desktop (static) */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col border-l border-gray-200 bg-white">
        <div className="flex h-16 items-center border-b border-gray-200 px-4">
          <span className="text-sm font-bold text-gray-900">{APP_NAME}</span>
        </div>
        <Sidebar role={role} />
      </aside>

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          fullName={fullName}
          role={role}
          onMenuToggle={() => setSidebarOpen(true)}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
