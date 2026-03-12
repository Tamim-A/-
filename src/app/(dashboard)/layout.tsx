import { requireAuth } from "@/lib/auth/guard";
import { AppShell } from "@/components/app-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAuth();

  return (
    <AppShell fullName={session.fullName} role={session.role}>
      {children}
    </AppShell>
  );
}
