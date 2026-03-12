import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "نظام إدارة المستفيدين",
  description: "نظام داخلي لإدارة بيانات المستفيدين",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-screen bg-gray-50 antialiased">{children}</body>
    </html>
  );
}
