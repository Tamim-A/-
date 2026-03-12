-- =============================================================
-- نظام إدارة المستفيدين — Row Level Security Policies
-- Migration 002: RLS
-- =============================================================

-- ─── HELPER: get current user's role ─────────────────────────
create or replace function public.current_user_role()
returns user_role as $$
  select role from profiles where id = auth.uid();
$$ language sql security definer stable;

-- ─── HELPER: is user active? ─────────────────────────────────
create or replace function public.current_user_is_active()
returns boolean as $$
  select coalesce(
    (select is_active from profiles where id = auth.uid()),
    false
  );
$$ language sql security definer stable;

-- =============================================================
-- PROFILES
-- =============================================================
alter table profiles enable row level security;

-- Admins: full access
create policy "profiles_admin_all"
  on profiles for all
  using  (public.current_user_role() = 'admin' and public.current_user_is_active())
  with check (public.current_user_role() = 'admin' and public.current_user_is_active());

-- Staff/Viewer: read own profile
create policy "profiles_self_select"
  on profiles for select
  using (id = auth.uid() and public.current_user_is_active());

-- =============================================================
-- BENEFICIARIES
-- =============================================================
alter table beneficiaries enable row level security;

-- Admin: full access
create policy "beneficiaries_admin_all"
  on beneficiaries for all
  using  (public.current_user_role() = 'admin' and public.current_user_is_active())
  with check (public.current_user_role() = 'admin' and public.current_user_is_active());

-- Staff: select
create policy "beneficiaries_staff_select"
  on beneficiaries for select
  using (public.current_user_role() = 'staff' and public.current_user_is_active());

-- Staff: insert
create policy "beneficiaries_staff_insert"
  on beneficiaries for insert
  with check (public.current_user_role() = 'staff' and public.current_user_is_active());

-- Staff: update (cannot archive — that requires setting archived_at)
create policy "beneficiaries_staff_update"
  on beneficiaries for update
  using  (public.current_user_role() = 'staff' and public.current_user_is_active())
  with check (public.current_user_role() = 'staff' and public.current_user_is_active());

-- Viewer: read-only
create policy "beneficiaries_viewer_select"
  on beneficiaries for select
  using (public.current_user_role() = 'viewer' and public.current_user_is_active());

-- =============================================================
-- IMPORT LOGS
-- =============================================================
alter table import_logs enable row level security;

-- Admin: full access
create policy "import_logs_admin_all"
  on import_logs for all
  using  (public.current_user_role() = 'admin' and public.current_user_is_active())
  with check (public.current_user_role() = 'admin' and public.current_user_is_active());

-- Staff: read + insert (they perform imports)
create policy "import_logs_staff_select"
  on import_logs for select
  using (public.current_user_role() = 'staff' and public.current_user_is_active());

create policy "import_logs_staff_insert"
  on import_logs for insert
  with check (public.current_user_role() = 'staff' and public.current_user_is_active());

-- Viewer: read-only
create policy "import_logs_viewer_select"
  on import_logs for select
  using (public.current_user_role() = 'viewer' and public.current_user_is_active());

-- =============================================================
-- AUDIT LOGS
-- =============================================================
alter table audit_logs enable row level security;

-- Admin: read all audit logs (no one can update/delete)
create policy "audit_logs_admin_select"
  on audit_logs for select
  using (public.current_user_role() = 'admin' and public.current_user_is_active());

-- All active users: insert audit logs (via service or triggers)
create policy "audit_logs_authenticated_insert"
  on audit_logs for insert
  with check (public.current_user_is_active());

-- Staff: read own audit logs
create policy "audit_logs_staff_self_select"
  on audit_logs for select
  using (public.current_user_role() = 'staff' and public.current_user_is_active() and user_id = auth.uid());
