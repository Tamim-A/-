import type { UserRole } from "@/types/database";

/** Ordered from most to least privileged */
const ROLE_HIERARCHY: UserRole[] = ["admin", "staff", "viewer"];

export function hasMinimumRole(
  userRole: UserRole,
  requiredRole: UserRole
): boolean {
  return (
    ROLE_HIERARCHY.indexOf(userRole) <= ROLE_HIERARCHY.indexOf(requiredRole)
  );
}

export function isAdmin(role: UserRole): boolean {
  return role === "admin";
}

export function canWrite(role: UserRole): boolean {
  return role === "admin" || role === "staff";
}

export function canManageUsers(role: UserRole): boolean {
  return role === "admin";
}
