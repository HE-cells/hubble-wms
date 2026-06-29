-- ============================================================
-- Migration: audit_log table (general-purpose)
-- Run in Supabase Studio → SQL Editor.
--
-- Creates a general-purpose audit_log table covering admin
-- actions across clients, employees, leave, expenses, and
-- requests. Separate from employee_audit_log (written by DB
-- triggers for field-level employee changes — unchanged).
--
-- RLS:
--   INSERT — authenticated users; actor_id must equal auth.uid()
--   SELECT — admin/owner only (via get_my_role())
-- ============================================================

create table if not exists public.audit_log (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  actor_id     uuid references public.profiles(id) on delete set null,
  actor_name   text,
  action       text not null,
  entity_type  text not null,
  entity_id    text,
  entity_label text,
  changes      jsonb,
  note         text
);

comment on table  public.audit_log is 'General-purpose admin action log. Rows inserted by client JS after successful writes.';
comment on column public.audit_log.action       is 'Snake_case verb_noun, e.g. approve_leave_request.';
comment on column public.audit_log.entity_type  is 'Domain object: client, employee, leave_request, flex_swap, expense, travel_claim, trip_request, deletion_request, name_change, job_title_change.';
comment on column public.audit_log.entity_id    is 'UUID of the affected row (as text).';
comment on column public.audit_log.entity_label is 'Human-readable label at time of action.';
comment on column public.audit_log.changes      is 'JSONB diff. Approvals: {status,reason}. Edits: {fields:{…}}. Provisions: {email,…}.';

create index if not exists idx_audit_log_created_at  on public.audit_log (created_at desc);
create index if not exists idx_audit_log_entity_type on public.audit_log (entity_type);
create index if not exists idx_audit_log_actor_id    on public.audit_log (actor_id);

alter table public.audit_log enable row level security;

create policy "audit_log_insert" on public.audit_log
  for insert to authenticated
  with check (actor_id = auth.uid());

create policy "audit_log_select_admin" on public.audit_log
  for select to authenticated
  using (get_my_role() in ('owner', 'admin'));

notify pgrst, 'reload schema';
