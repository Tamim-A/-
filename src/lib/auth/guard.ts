import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/database";
import { hasMinimumRole } from "./roles";

export interface AuthSession {
  userId: string;
  email: string;
  role: UserRole;
  fullName: string;
}

/**
 * Server-side auth guard for use in Server Components and Server Actions.
 *
 * Verifies the user is authenticated and active, then returns their session.
 * Optionally enforces a minimum role level.
 *
 * Usage in a Server Component:
 *   const session = await requireAuth("staff");
 */
export async function requireAuth(
  minimumRole?: UserRole
): Promise<AuthSession> {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, role, is_active")
    .eq("id", user.id)
    .single();

  if (!profile || !profile.is_active) {
    // Inactive users get signed out
    await supabase.auth.signOut();
    redirect("/auth/login");
  }

  if (minimumRole && !hasMinimumRole(profile.role, minimumRole)) {
    redirect("/unauthorized");
  }

  return {
    userId: user.id,
    email: profile.email,
    role: profile.role,
    fullName: profile.full_name,
  };
}
