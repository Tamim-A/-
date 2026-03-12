-- =============================================================
-- نظام إدارة المستفيدين — Audit Logging Triggers
-- Migration 003: Automatic audit trail
-- =============================================================

-- ─── BENEFICIARY: INSERT ─────────────────────────────────────
create or replace function audit_beneficiary_insert()
returns trigger as $$
begin
  insert into public.audit_logs (user_id, action, entity_type, entity_id, new_data)
  values (
    coalesce(auth.uid(), new.created_by),
    'create_beneficiary',
    'beneficiary',
    new.id,
    to_jsonb(new)
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists trg_audit_beneficiary_insert on beneficiaries;
create trigger trg_audit_beneficiary_insert
  after insert on beneficiaries
  for each row execute function audit_beneficiary_insert();

-- ─── BENEFICIARY: UPDATE ─────────────────────────────────────
create or replace function audit_beneficiary_update()
returns trigger as $$
declare
  _action audit_action;
begin
  -- Detect archive vs regular update
  if new.archived_at is not null and old.archived_at is null then
    _action := 'archive_beneficiary';
  else
    _action := 'update_beneficiary';
  end if;

  insert into public.audit_logs (user_id, action, entity_type, entity_id, old_data, new_data)
  values (
    coalesce(auth.uid(), new.updated_by),
    _action,
    'beneficiary',
    new.id,
    to_jsonb(old),
    to_jsonb(new)
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists trg_audit_beneficiary_update on beneficiaries;
create trigger trg_audit_beneficiary_update
  after update on beneficiaries
  for each row execute function audit_beneficiary_update();

-- ─── IMPORT LOG: INSERT ──────────────────────────────────────
create or replace function audit_import_log_insert()
returns trigger as $$
begin
  insert into public.audit_logs (user_id, action, entity_type, entity_id, new_data)
  values (
    new.imported_by,
    'import_beneficiaries',
    'import_log',
    new.id,
    to_jsonb(new)
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists trg_audit_import_log_insert on import_logs;
create trigger trg_audit_import_log_insert
  after insert on import_logs
  for each row execute function audit_import_log_insert();

-- ─── PROFILE: INSERT ─────────────────────────────────────────
create or replace function audit_profile_insert()
returns trigger as $$
begin
  insert into public.audit_logs (user_id, action, entity_type, entity_id, new_data)
  values (
    coalesce(auth.uid(), new.id),
    'create_user',
    'profile',
    new.id,
    jsonb_build_object(
      'full_name', new.full_name,
      'email',     new.email,
      'role',      new.role,
      'is_active', new.is_active
    )
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists trg_audit_profile_insert on profiles;
create trigger trg_audit_profile_insert
  after insert on profiles
  for each row execute function audit_profile_insert();

-- ─── PROFILE: UPDATE ─────────────────────────────────────────
create or replace function audit_profile_update()
returns trigger as $$
begin
  insert into public.audit_logs (user_id, action, entity_type, entity_id, old_data, new_data)
  values (
    coalesce(auth.uid(), new.id),
    'update_user',
    'profile',
    new.id,
    jsonb_build_object(
      'full_name', old.full_name,
      'email',     old.email,
      'role',      old.role,
      'is_active', old.is_active
    ),
    jsonb_build_object(
      'full_name', new.full_name,
      'email',     new.email,
      'role',      new.role,
      'is_active', new.is_active
    )
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists trg_audit_profile_update on profiles;
create trigger trg_audit_profile_update
  after update on profiles
  for each row execute function audit_profile_update();
