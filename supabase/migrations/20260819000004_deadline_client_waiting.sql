-- ============================================================================
-- Copied verbatim from repo root: supabase-deadline-client-waiting.sql
-- Adds the client_deadline/internal_due_date pair + client-waiting columns to creative_requests; creates task_client_waiting_periods.
-- ============================================================================

-- Creative OS deadline and client-waiting upgrade
-- Run this in Supabase SQL Editor once before relying on the new reporting fields.

alter table public.creative_requests
    add column if not exists original_client_deadline date,
    add column if not exists client_deadline date,
    add column if not exists original_internal_due_date date,
    add column if not exists internal_due_date date,
    add column if not exists internal_due_source text,
    add column if not exists internal_due_manually_adjusted boolean not null default false,
    add column if not exists completed_at timestamptz,
    add column if not exists client_waiting_since timestamptz,
    add column if not exists client_waiting_reason text,
    add column if not exists client_follow_up_date date,
    add column if not exists client_follow_up_owner text,
    add column if not exists client_waiting_note text,
    add column if not exists deadline_extension_count integer not null default 0,
    add column if not exists latest_deadline_change_reason text;

update public.creative_requests
set
    client_deadline = coalesce(client_deadline, deadline),
    original_client_deadline = coalesce(original_client_deadline, client_deadline, deadline),
    completed_at = coalesce(completed_at, done_at)
where client_deadline is null
   or original_client_deadline is null
   or completed_at is null;

update public.creative_requests
set
    internal_due_source = coalesce(internal_due_source, case when internal_due_date is not null then 'manual' else null end),
    internal_due_manually_adjusted = case
        when internal_due_source = 'manual' or (internal_due_source is null and internal_due_date is not null) then true
        else coalesce(internal_due_manually_adjusted, false)
    end
where internal_due_source is null
   or internal_due_manually_adjusted is null;

do $$
begin
    if not exists (
        select 1
        from pg_constraint c
        join pg_class t on t.oid = c.conrelid
        join pg_namespace n on n.oid = t.relnamespace
        where n.nspname = 'public'
          and t.relname = 'creative_requests'
          and c.conname = 'creative_requests_internal_due_source_check'
    ) then
        alter table public.creative_requests
            add constraint creative_requests_internal_due_source_check
            check (
                internal_due_source is null
                or internal_due_source in ('system_generated', 'manual', 'migrated', 'legacy', 'derived_pending_backfill')
            );
    end if;
end $$;

do $$
declare
    constraint_name text;
begin
    select c.conname
    into constraint_name
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = 'creative_requests'
      and c.contype = 'c'
      and pg_get_constraintdef(c.oid) ilike '%work_status%'
    limit 1;

    if constraint_name is not null then
        execute format('alter table public.creative_requests drop constraint %I', constraint_name);
    end if;

    alter table public.creative_requests
        add constraint creative_requests_work_status_check
        check (
            work_status is null
            or lower(replace(work_status, '_', ' ')) in (
                'not started',
                'drafting',
                'partial ready',
                'revision',
                'internal review',
                'client review',
                'awaiting client',
                'done'
            )
        );
end $$;

create table if not exists public.task_client_waiting_periods (
    id uuid primary key default gen_random_uuid(),
    job_id text not null,
    waiting_reason text,
    waiting_note text,
    waiting_started_at timestamptz not null default now(),
    waiting_ended_at timestamptz,
    follow_up_date date,
    follow_up_owner text,
    created_by text,
    resolved_by text,
    resolution_status text,
    resolution_note text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_task_client_waiting_job_id
    on public.task_client_waiting_periods(job_id);

create index if not exists idx_task_client_waiting_active
    on public.task_client_waiting_periods(job_id, waiting_ended_at);

create index if not exists idx_creative_requests_internal_due
    on public.creative_requests(internal_due_date);

create index if not exists idx_creative_requests_client_deadline
    on public.creative_requests(client_deadline);

create index if not exists idx_creative_requests_client_follow_up
    on public.creative_requests(client_follow_up_date);

-- Internal due dates for existing active tasks are backfilled by the app with
-- the same JavaScript complexity rules used for new requests. This avoids SQL
-- guessing for one-day versus two-day buffers and only fills null values.

alter table public.task_client_waiting_periods enable row level security;

drop policy if exists "Creative OS can read client waiting periods" on public.task_client_waiting_periods;
drop policy if exists "Creative OS can insert client waiting periods" on public.task_client_waiting_periods;
drop policy if exists "Creative OS can update client waiting periods" on public.task_client_waiting_periods;

-- This matches the current browser/anon-key app model.
-- Tighten these policies later when Supabase Auth user roles are introduced.
create policy "Creative OS can read client waiting periods"
    on public.task_client_waiting_periods
    for select
    to anon, authenticated
    using (true);

create policy "Creative OS can insert client waiting periods"
    on public.task_client_waiting_periods
    for insert
    to anon, authenticated
    with check (true);

create policy "Creative OS can update client waiting periods"
    on public.task_client_waiting_periods
    for update
    to anon, authenticated
    using (true)
    with check (true);
