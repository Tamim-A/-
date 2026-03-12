-- =============================================================
-- نظام إدارة المستفيدين — Beneficiary Management System
-- Migration 001: Core Schema
-- =============================================================

-- ─── EXTENSIONS ──────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── CUSTOM TYPES ────────────────────────────────────────────
do $$ begin
  create type user_role  as enum ('admin', 'staff', 'viewer');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type beneficiary_status as enum ('active', 'inactive', 'archived');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type audit_action as enum (
    'create_beneficiary',
    'update_beneficiary',
    'archive_beneficiary',
    'import_beneficiaries',
    'export_beneficiaries',
    'create_user',
    'update_user'
  );
exception when duplicate_object then null;
end $$;

-- Ensure all enum values exist (handles pre-existing type with fewer values)
alter type audit_action add value if not exists 'create_beneficiary';
alter type audit_action add value if not exists 'update_beneficiary';
alter type audit_action add value if not exists 'archive_beneficiary';
alter type audit_action add value if not exists 'import_beneficiaries';
alter type audit_action add value if not exists 'export_beneficiaries';
alter type audit_action add value if not exists 'create_user';
alter type audit_action add value if not exists 'update_user';

-- ─── 1. PROFILES ─────────────────────────────────────────────
create table if not exists profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  full_name  text        not null,
  email      text        not null unique,
  role       user_role   not null default 'viewer',
  is_active  boolean     not null default true,
  created_at timestamptz not null default now()
);

comment on table profiles is 'Staff user profiles linked to Supabase Auth';

-- ─── 2. BENEFICIARIES ────────────────────────────────────────
create table if not exists beneficiaries (
  id             uuid primary key default uuid_generate_v4(),
  national_id    text              not null,
  full_name      text              not null,
  phone          text              not null,
  city           text              not null,
  support_amount numeric(12,2)     not null check (support_amount >= 0),
  notes          text,
  status         beneficiary_status not null default 'active',
  source         text              not null default 'manual',
  created_at     timestamptz       not null default now(),
  updated_at     timestamptz       not null default now(),
  created_by     uuid              references profiles(id),
  updated_by     uuid              references profiles(id),
  archived_at    timestamptz,

  constraint uq_beneficiaries_national_id unique (national_id)
);

comment on table beneficiaries is 'Individual beneficiary records';

-- ─── 3. IMPORT LOGS ─────────────────────────────────────────
create table if not exists import_logs (
  id             uuid primary key default uuid_generate_v4(),
  file_name      text        not null,
  imported_by    uuid        not null references profiles(id),
  imported_at    timestamptz not null default now(),
  total_rows     int         not null default 0,
  success_rows   int         not null default 0,
  failed_rows    int         not null default 0,
  duplicate_rows int         not null default 0,
  notes          text
);

comment on table import_logs is 'Tracks bulk import operations';

-- ─── 4. AUDIT LOGS ──────────────────────────────────────────
create table if not exists audit_logs (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid         not null references profiles(id),
  action      audit_action not null,
  entity_type text         not null,
  entity_id   uuid,
  old_data    jsonb,
  new_data    jsonb,
  created_at  timestamptz  not null default now()
);

comment on table audit_logs is 'Immutable audit trail for all sensitive operations';

-- ─── INDEXES ─────────────────────────────────────────────────
create index if not exists idx_beneficiaries_phone      on beneficiaries (phone);
create index if not exists idx_beneficiaries_full_name  on beneficiaries (full_name);
create index if not exists idx_beneficiaries_city       on beneficiaries (city);
create index if not exists idx_beneficiaries_created_at on beneficiaries (created_at);
create index if not exists idx_beneficiaries_status     on beneficiaries (status);

create index if not exists idx_audit_logs_user_id    on audit_logs (user_id);
create index if not exists idx_audit_logs_entity     on audit_logs (entity_type, entity_id);
create index if not exists idx_audit_logs_created_at on audit_logs (created_at);

create index if not exists idx_import_logs_imported_by on import_logs (imported_by);

-- ─── AUTO-UPDATE updated_at ──────────────────────────────────
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_beneficiaries_updated_at on beneficiaries;
create trigger trg_beneficiaries_updated_at
  before update on beneficiaries
  for each row execute function set_updated_at();

-- ─── AUTO-CREATE PROFILE ON SIGNUP ───────────────────────────
-- When an admin creates a user via Supabase Auth, this trigger
-- automatically inserts a corresponding profiles row.
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, role, is_active)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email,
    'viewer',
    true
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
