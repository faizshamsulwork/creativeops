-- Creative OS Client Review aging automation
-- Run this once in Supabase SQL Editor after supabase-deadline-client-waiting.sql.
-- It adds the current Client Review period fields, backend working-day helpers,
-- an idempotent aging function, and an optional hourly pg_cron schedule.

create extension if not exists pgcrypto;

create table if not exists public.creative_ops_workspace_settings (
    id text primary key default 'default',
    workspace_timezone text not null default 'Asia/Kuala_Lumpur',
    client_review_window_days integer not null default 5,
    client_review_auto_move_enabled boolean not null default true,
    updated_at timestamptz not null default now()
);

insert into public.creative_ops_workspace_settings (id, workspace_timezone, client_review_window_days, client_review_auto_move_enabled)
values ('default', 'Asia/Kuala_Lumpur', 5, true)
on conflict (id) do nothing;

alter table public.creative_requests
    add column if not exists client_waiting_since timestamptz,
    add column if not exists client_waiting_reason text,
    add column if not exists client_follow_up_date date,
    add column if not exists client_follow_up_owner text,
    add column if not exists client_follow_up_owner_id text,
    add column if not exists client_waiting_note text,
    add column if not exists client_review_started_at timestamptz,
    add column if not exists client_review_ended_at timestamptz,
    add column if not exists client_review_window_days integer,
    add column if not exists client_review_auto_move_enabled boolean not null default true,
    add column if not exists client_review_auto_move_exempt boolean not null default false,
    add column if not exists client_review_exemption_reason text,
    add column if not exists client_review_auto_moved_at timestamptz,
    add column if not exists client_review_meaningful_response_at timestamptz,
    add column if not exists client_review_audit_required boolean not null default false,
    add column if not exists client_review_start_source text,
    add column if not exists auto_move_snoozed_until timestamptz;

create index if not exists idx_creative_requests_client_review_status
    on public.creative_requests(work_status, client_review_started_at);

create index if not exists idx_creative_requests_client_review_automation
    on public.creative_requests(client_review_auto_move_enabled, client_review_auto_move_exempt, client_review_auto_moved_at);

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

update public.creative_requests
set work_status = 'awaiting_client'
where lower(replace(coalesce(work_status, ''), '_', ' ')) = 'awaiting client'
  and work_status is distinct from 'awaiting_client';

create table if not exists public.task_client_waiting_periods (
    id uuid primary key default gen_random_uuid(),
    job_id text not null,
    waiting_reason text,
    waiting_note text,
    waiting_started_at timestamptz not null default now(),
    waiting_ended_at timestamptz,
    follow_up_date date,
    follow_up_owner text,
    follow_up_owner_id text,
    created_by text,
    resolved_by text,
    resolution_status text,
    resolution_note text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

alter table public.task_client_waiting_periods
    add column if not exists follow_up_owner_id text;

create table if not exists public.task_activity_logs (
    id uuid primary key default gen_random_uuid(),
    job_id text not null,
    action_type text not null,
    actor_name text,
    old_value text,
    new_value text,
    note_text text,
    meta jsonb default '{}'::jsonb,
    created_at timestamptz default now()
);

create index if not exists idx_task_client_waiting_job_id_active
    on public.task_client_waiting_periods(job_id, waiting_ended_at);

with duplicate_active_waiting as (
    select
        id,
        row_number() over (partition by job_id order by waiting_started_at desc, created_at desc, id desc) as rn
    from public.task_client_waiting_periods
    where waiting_ended_at is null
)
update public.task_client_waiting_periods p
set
    waiting_ended_at = now(),
    resolved_by = coalesce(p.resolved_by, 'SQL migration'),
    resolution_status = coalesce(p.resolution_status, 'deduplicated'),
    resolution_note = coalesce(p.resolution_note, 'Closed duplicate active waiting period during Client Review migration.'),
    updated_at = now()
from duplicate_active_waiting d
where p.id = d.id
  and d.rn > 1;

create unique index if not exists idx_task_client_waiting_one_active
    on public.task_client_waiting_periods(job_id)
    where waiting_ended_at is null;

create index if not exists idx_task_activity_logs_job_id_created_at
    on public.task_activity_logs(job_id, created_at desc);

grant usage on schema public to anon, authenticated;
grant select, insert, update on public.task_client_waiting_periods to anon, authenticated;
grant select, insert on public.task_activity_logs to anon, authenticated;

alter table public.task_client_waiting_periods enable row level security;

drop policy if exists "Creative OS can read client waiting periods" on public.task_client_waiting_periods;
drop policy if exists "Creative OS can insert client waiting periods" on public.task_client_waiting_periods;
drop policy if exists "Creative OS can update client waiting periods" on public.task_client_waiting_periods;
drop policy if exists "Creative OS auth read client waiting periods" on public.task_client_waiting_periods;

-- Current browser build still uses the anon Supabase key with app-level access
-- checks. Keep anon policies compatible, while authenticated deployments can
-- tighten through the cross-region PIC migration helpers.
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

alter table public.task_activity_logs enable row level security;

drop policy if exists "Creative OS can read activity logs" on public.task_activity_logs;
drop policy if exists "Creative OS can insert activity logs" on public.task_activity_logs;

create policy "Creative OS can read activity logs"
    on public.task_activity_logs
    for select
    to anon, authenticated
    using (true);

create policy "Creative OS can insert activity logs"
    on public.task_activity_logs
    for insert
    to anon, authenticated
    with check (true);

create or replace function public.creative_ops_is_working_day(p_date date)
returns boolean
language sql
immutable
as $$
    select extract(isodow from p_date) between 1 and 5;
$$;

create or replace function public.creative_ops_add_working_days(p_start_date date, p_days integer default 1)
returns date
language plpgsql
immutable
as $$
declare
    v_date date := p_start_date;
    v_remaining integer := greatest(coalesce(p_days, 0), 0);
begin
    if v_date is null then
        return null;
    end if;

    while v_remaining > 0 loop
        v_date := v_date + 1;
        if public.creative_ops_is_working_day(v_date) then
            v_remaining := v_remaining - 1;
        end if;
    end loop;

    while not public.creative_ops_is_working_day(v_date) loop
        v_date := v_date + 1;
    end loop;

    return v_date;
end;
$$;

create or replace function public.creative_ops_working_days_between(
    p_start timestamptz,
    p_end timestamptz default now(),
    p_timezone text default 'Asia/Kuala_Lumpur'
)
returns integer
language plpgsql
stable
as $$
declare
    v_start date;
    v_end date;
    v_cursor date;
    v_direction integer;
    v_count integer := 0;
begin
    if p_start is null or p_end is null then
        return null;
    end if;

    v_start := (p_start at time zone coalesce(nullif(p_timezone, ''), 'Asia/Kuala_Lumpur'))::date;
    v_end := (p_end at time zone coalesce(nullif(p_timezone, ''), 'Asia/Kuala_Lumpur'))::date;
    v_direction := case when v_start <= v_end then 1 else -1 end;
    v_cursor := v_start;

    while (v_direction = 1 and v_cursor < v_end)
       or (v_direction = -1 and v_cursor > v_end) loop
        v_cursor := v_cursor + v_direction;
        if public.creative_ops_is_working_day(v_cursor) then
            v_count := v_count + v_direction;
        end if;
    end loop;

    return v_count;
end;
$$;

-- Backfill a reliable active Client Review start when existing data has it.
-- Historical stale reviews are marked for admin audit so they do not auto-move silently.
update public.creative_requests cr
set
    client_review_started_at = coalesce(cr.client_review_started_at, cr.review_started_at, cr.last_moved_at),
    client_review_start_source = coalesce(
        cr.client_review_start_source,
        case
            when cr.client_review_started_at is not null then 'existing_client_review_started_at'
            when cr.review_started_at is not null then 'legacy_review_started_at'
            when cr.last_moved_at is not null then 'estimated_last_moved_at'
            else null
        end
    )
where lower(replace(coalesce(cr.work_status, ''), '_', ' ')) = 'client review'
  and cr.client_review_started_at is null
  and coalesce(cr.review_started_at, cr.last_moved_at) is not null;

update public.creative_requests cr
set
    client_review_audit_required = true,
    client_review_auto_move_enabled = false,
    client_review_exemption_reason = coalesce(cr.client_review_exemption_reason, 'Historical Client Review requires admin audit before automation.')
from public.creative_ops_workspace_settings s
where s.id = 'default'
  and lower(replace(coalesce(cr.work_status, ''), '_', ' ')) = 'client review'
  and lower(coalesce(cr.status, '')) = 'approved'
  and cr.client_review_auto_moved_at is null
  and coalesce(cr.client_review_audit_required, false) = false
  and coalesce(cr.client_review_started_at, cr.review_started_at, cr.last_moved_at) is not null
  and public.creative_ops_working_days_between(
        coalesce(cr.client_review_started_at, cr.review_started_at, cr.last_moved_at),
        now(),
        s.workspace_timezone
      ) > coalesce(cr.client_review_window_days, s.client_review_window_days, 5);

create or replace function public.move_client_review_to_awaiting(
    p_job_id text,
    p_waiting_reason text default 'Awaiting feedback / approval',
    p_waiting_since timestamptz default now(),
    p_follow_up_date date default null,
    p_follow_up_owner text default null,
    p_follow_up_owner_id text default null,
    p_waiting_note text default null,
    p_actor_name text default null,
    p_source text default 'manual_app',
    p_idempotency_key text default null
)
returns public.creative_requests
language plpgsql
security definer
set search_path = public
as $$
declare
    v_task public.creative_requests%rowtype;
    v_updated public.creative_requests%rowtype;
    v_previous_status text;
    v_waiting_reason text := coalesce(nullif(trim(p_waiting_reason), ''), 'Awaiting feedback / approval');
    v_waiting_since timestamptz := coalesce(p_waiting_since, now());
    v_follow_up_owner text := nullif(trim(coalesce(p_follow_up_owner, '')), '');
    v_follow_up_owner_id text := nullif(trim(coalesce(p_follow_up_owner_id, '')), '');
    v_resolved_owner_id text;
    v_waiting_note text := nullif(trim(coalesce(p_waiting_note, '')), '');
    v_actor text := coalesce(nullif(trim(p_actor_name), ''), 'Creative OS');
    v_source text := coalesce(nullif(trim(p_source), ''), 'manual_app');
    v_key text := coalesce(nullif(trim(p_idempotency_key), ''), 'client-review-manual:' || coalesce(p_job_id, 'missing') || ':' || to_char(now(), 'YYYYMMDDHH24MISSMS'));
begin
    if nullif(trim(coalesce(p_job_id, '')), '') is null then
        raise exception 'Client Review move failed: job_id is required.';
    end if;

    if p_follow_up_date is null then
        raise exception 'Client Review move failed for %: follow_up_date is required.', p_job_id;
    end if;

    if v_follow_up_owner is null then
        raise exception 'Client Review move failed for %: follow_up_owner is required.', p_job_id;
    end if;

    select cr.*
    into v_task
    from public.creative_requests cr
    where cr.job_id = p_job_id
    for update;

    if not found then
        raise exception 'Client Review move failed: task % was not found.', p_job_id;
    end if;

    if lower(coalesce(v_task.status, '')) in ('deleted', 'archived', 'cancelled', 'canceled') then
        raise exception 'Client Review move failed for %: task is %.', p_job_id, v_task.status;
    end if;

    v_previous_status := v_task.work_status;

    if lower(replace(coalesce(v_task.work_status, ''), '_', ' ')) = 'awaiting client' then
        return v_task;
    end if;

    if lower(replace(coalesce(v_task.work_status, ''), '_', ' ')) <> 'client review' then
        raise exception 'Client Review move failed for %: current work_status is %, expected Client Review.', p_job_id, coalesce(v_task.work_status, 'empty');
    end if;

    select
        tm.name,
        coalesce(
            nullif(to_jsonb(tm) ->> 'auth_user_id', ''),
            nullif(to_jsonb(tm) ->> 'user_id', ''),
            nullif(to_jsonb(tm) ->> 'supabase_user_id', ''),
            nullif(to_jsonb(tm) ->> 'uuid', ''),
            nullif(to_jsonb(tm) ->> 'member_id', ''),
            nullif(to_jsonb(tm) ->> 'team_member_id', ''),
            nullif(to_jsonb(tm) ->> 'id', ''),
            nullif(to_jsonb(tm) ->> 'member_key', '')
        )
    into v_follow_up_owner, v_resolved_owner_id
    from public.team_members tm
    where lower(regexp_replace(tm.name, '\s+', ' ', 'g')) = lower(regexp_replace(v_follow_up_owner, '\s+', ' ', 'g'))
      and coalesce(lower(to_jsonb(tm) ->> 'is_active') not in ('false', '0', 'no'), true) = true
      and lower(coalesce(to_jsonb(tm) ->> 'status', 'active')) not in ('inactive', 'removed', 'deleted', 'archived', 'resigned', 'left', 'offboard')
    order by tm.name
    limit 1;

    if v_follow_up_owner is null then
        raise exception 'Client Review move failed for %: follow-up owner is not an active team member.', p_job_id;
    end if;

    v_follow_up_owner_id := coalesce(
        v_follow_up_owner_id,
        v_resolved_owner_id,
        lower(regexp_replace(v_follow_up_owner, '[^a-zA-Z0-9]+', '-', 'g'))
    );

    update public.creative_requests cr
    set
        work_status = 'awaiting_client',
        last_moved_at = now(),
        client_waiting_since = v_waiting_since,
        client_waiting_reason = v_waiting_reason,
        client_follow_up_date = p_follow_up_date,
        client_follow_up_owner = v_follow_up_owner,
        client_follow_up_owner_id = v_follow_up_owner_id,
        client_waiting_note = v_waiting_note,
        client_review_ended_at = now(),
        client_review_auto_move_enabled = true,
        client_review_auto_moved_at = case
            when v_source in ('system_automation', 'browser_automation') then now()
            else cr.client_review_auto_moved_at
        end
    where cr.job_id = p_job_id
      and lower(replace(coalesce(cr.work_status, ''), '_', ' ')) = 'client review'
    returning cr.* into v_updated;

    if v_updated.job_id is null then
        raise exception 'Client Review move failed for %: task changed before save. Refresh and try again.', p_job_id;
    end if;

    insert into public.task_client_waiting_periods (
        job_id,
        waiting_reason,
        waiting_note,
        waiting_started_at,
        follow_up_date,
        follow_up_owner,
        follow_up_owner_id,
        created_by,
        updated_at
    )
    values (
        p_job_id,
        v_waiting_reason,
        v_waiting_note,
        v_waiting_since,
        p_follow_up_date,
        v_follow_up_owner,
        v_follow_up_owner_id,
        v_actor,
        now()
    )
    on conflict (job_id) where waiting_ended_at is null
    do update set
        waiting_reason = excluded.waiting_reason,
        waiting_note = excluded.waiting_note,
        waiting_started_at = excluded.waiting_started_at,
        follow_up_date = excluded.follow_up_date,
        follow_up_owner = excluded.follow_up_owner,
        follow_up_owner_id = excluded.follow_up_owner_id,
        updated_at = now();

    insert into public.task_activity_logs (
        job_id,
        action_type,
        actor_name,
        old_value,
        new_value,
        note_text,
        meta,
        created_at
    )
    select
        p_job_id,
        case
            when v_source in ('system_automation', 'browser_automation') then 'client_review_auto_moved'
            else 'client_review_manual_moved_to_awaiting'
        end,
        v_actor,
        coalesce(v_previous_status, 'Client Review'),
        'awaiting_client',
        coalesce(v_waiting_note, v_waiting_reason),
        jsonb_build_object(
            'idempotency_key', v_key,
            'waiting_reason', v_waiting_reason,
            'waiting_since', v_waiting_since,
            'follow_up_owner', v_follow_up_owner,
            'follow_up_owner_id', v_follow_up_owner_id,
            'follow_up_date', p_follow_up_date,
            'executed_at', now(),
            'source', v_source
        ),
        now()
    where not exists (
        select 1
        from public.task_activity_logs l
        where l.job_id = p_job_id
          and l.action_type in ('client_review_manual_moved_to_awaiting', 'client_review_auto_moved')
          and l.meta ->> 'idempotency_key' = v_key
    );

    return v_updated;
end;
$$;

grant execute on function public.move_client_review_to_awaiting(text, text, timestamptz, date, text, text, text, text, text, text) to anon, authenticated;

create or replace function public.run_client_review_aging_check(
    p_now timestamptz default now(),
    p_dry_run boolean default false
)
returns table (
    job_id text,
    previous_status text,
    new_status text,
    review_started_at timestamptz,
    review_working_days integer,
    follow_up_owner text,
    follow_up_date date,
    action_taken text
)
language plpgsql
security definer
set search_path = public
as $$
declare
    v_settings record;
    v_task record;
    v_age integer;
    v_follow_up date;
    v_owner text;
    v_owner_id text;
    v_automation_key text;
    v_updated_job_id text;
begin
    select *
    into v_settings
    from public.creative_ops_workspace_settings
    where id = 'default';

    if v_settings is null then
        select
            'default'::text as id,
            'Asia/Kuala_Lumpur'::text as workspace_timezone,
            5::integer as client_review_window_days,
            true::boolean as client_review_auto_move_enabled,
            now()::timestamptz as updated_at
        into v_settings;
    end if;

    if coalesce(v_settings.client_review_auto_move_enabled, true) = false then
        return;
    end if;

    for v_task in
        select
            cr.*,
            coalesce(cr.client_review_started_at, cr.review_started_at, cr.last_moved_at) as active_review_started_at,
            coalesce(cr.client_review_window_days, v_settings.client_review_window_days, 5) as active_review_window_days
        from public.creative_requests cr
        where lower(replace(coalesce(cr.work_status, ''), '_', ' ')) = 'client review'
          and lower(coalesce(cr.status, '')) = 'approved'
          and coalesce(cr.client_review_auto_move_enabled, true) = true
          and coalesce(cr.client_review_auto_move_exempt, false) = false
          and coalesce(cr.client_review_audit_required, false) = false
          and cr.client_review_auto_moved_at is null
          and (cr.auto_move_snoozed_until is null or cr.auto_move_snoozed_until <= p_now)
          and lower(coalesce(cr.status, '')) not in ('deleted', 'archived', 'cancelled', 'canceled')
    loop
        if v_task.active_review_started_at is null then
            job_id := v_task.job_id;
            previous_status := v_task.work_status;
            new_status := v_task.work_status;
            review_started_at := null;
            review_working_days := null;
            follow_up_owner := null;
            follow_up_date := null;
            action_taken := 'missing_review_start';
            return next;
            continue;
        end if;

        if v_task.client_review_meaningful_response_at is not null
           and v_task.client_review_meaningful_response_at >= v_task.active_review_started_at then
            continue;
        end if;

        if exists (
            select 1
            from public.task_activity_logs l
            where l.job_id = v_task.job_id
              and l.created_at >= v_task.active_review_started_at
              and l.action_type in (
                'client_response_recorded',
                'client_approval_recorded',
                'client_revision_requested',
                'client_assets_received',
                'client_review_period_restarted'
              )
        ) then
            continue;
        end if;

        v_age := public.creative_ops_working_days_between(
            v_task.active_review_started_at,
            p_now,
            v_settings.workspace_timezone
        );

        if v_age <= v_task.active_review_window_days then
            continue;
        end if;

        v_owner := null;
        v_owner_id := null;
        select
            tm.name,
            coalesce(
                nullif(to_jsonb(tm) ->> 'auth_user_id', ''),
                nullif(to_jsonb(tm) ->> 'user_id', ''),
                nullif(to_jsonb(tm) ->> 'supabase_user_id', ''),
                nullif(to_jsonb(tm) ->> 'uuid', ''),
                nullif(to_jsonb(tm) ->> 'member_id', ''),
                nullif(to_jsonb(tm) ->> 'team_member_id', ''),
                nullif(to_jsonb(tm) ->> 'id', ''),
                nullif(to_jsonb(tm) ->> 'member_key', '')
            )
        into v_owner, v_owner_id
        from public.team_members tm
        where lower(tm.name) in (
            lower(nullif(v_task.client_follow_up_owner, '')),
            lower(nullif(v_task.requester_name, '')),
            lower(nullif(v_task.approver, ''))
        )
          and coalesce(lower(to_jsonb(tm) ->> 'is_active') not in ('false', '0', 'no'), true) = true
          and lower(coalesce(to_jsonb(tm) ->> 'status', 'active')) not in ('inactive', 'removed', 'deleted', 'archived', 'resigned', 'left', 'offboard')
        order by
            case
                when lower(tm.name) = lower(nullif(v_task.client_follow_up_owner, '')) then 1
                when lower(tm.name) = lower(nullif(v_task.requester_name, '')) then 2
                when lower(tm.name) = lower(nullif(v_task.approver, '')) then 3
                else 9
            end
        limit 1;

        v_owner := coalesce(
            nullif(v_owner, ''),
            nullif(v_task.client_follow_up_owner, ''),
            nullif(v_task.requester_name, ''),
            nullif(v_task.approver, ''),
            'Admin'
        );
        v_owner_id := coalesce(
            nullif(v_owner_id, ''),
            nullif(v_task.client_follow_up_owner_id, ''),
            lower(regexp_replace(v_owner, '[^a-zA-Z0-9]+', '-', 'g'))
        );
        v_follow_up := public.creative_ops_add_working_days((p_now at time zone v_settings.workspace_timezone)::date, 1);
        v_automation_key := 'client-review-auto:' || v_task.job_id || ':' || to_char(v_task.active_review_started_at, 'YYYYMMDDHH24MISS');

        if p_dry_run then
            job_id := v_task.job_id;
            previous_status := v_task.work_status;
            new_status := 'awaiting_client';
            review_started_at := v_task.active_review_started_at;
            review_working_days := v_age;
            follow_up_owner := v_owner;
            follow_up_date := v_follow_up;
            action_taken := 'would_move';
            return next;
            continue;
        end if;

        v_updated_job_id := null;
        update public.creative_requests cr
        set
            work_status = 'awaiting_client',
            last_moved_at = p_now,
            client_waiting_since = p_now,
            client_waiting_reason = 'Awaiting feedback / approval',
            client_follow_up_date = v_follow_up,
            client_follow_up_owner = v_owner,
            client_follow_up_owner_id = v_owner_id,
            client_waiting_note = 'System automation: no client response after ' || v_age || ' completed working day(s).',
            client_review_ended_at = p_now,
            client_review_auto_moved_at = p_now
        where cr.job_id = v_task.job_id
          and lower(replace(coalesce(cr.work_status, ''), '_', ' ')) = 'client review'
          and coalesce(cr.client_review_started_at, cr.review_started_at, cr.last_moved_at) = v_task.active_review_started_at
          and cr.client_review_auto_moved_at is null
        returning cr.job_id into v_updated_job_id;

        if v_updated_job_id is null then
            continue;
        end if;

        insert into public.task_client_waiting_periods (
            job_id,
            waiting_reason,
            waiting_note,
            waiting_started_at,
            follow_up_date,
            follow_up_owner,
            follow_up_owner_id,
            created_by
        )
        select
            v_task.job_id,
            'Awaiting feedback / approval',
            'System automation: no client response after ' || v_age || ' completed working day(s).',
            p_now,
            v_follow_up,
            v_owner,
            v_owner_id,
            'System automation'
        where not exists (
            select 1
            from public.task_client_waiting_periods p
            where p.job_id = v_task.job_id
              and p.waiting_ended_at is null
        );

        insert into public.task_activity_logs (
            job_id,
            action_type,
            actor_name,
            old_value,
            new_value,
            note_text,
            meta,
            created_at
        )
        select
            v_task.job_id,
            'client_review_auto_moved',
            'System automation',
            'Client Review',
            'awaiting_client',
            'Automatically moved from Client Review to Awaiting Client. No client response after ' || v_age || ' completed working day(s).',
            jsonb_build_object(
                'automation_key', v_automation_key,
                'automation_rule', '5_working_day_client_review',
                'review_started_at', v_task.active_review_started_at,
                'review_working_days', v_age,
                'waiting_reason', 'Awaiting feedback / approval',
                'follow_up_owner', v_owner,
                'follow_up_owner_id', v_owner_id,
                'follow_up_date', v_follow_up,
                'executed_at', p_now,
                'triggered_by', 'Supabase scheduled function'
            ),
            p_now
        where not exists (
            select 1
            from public.task_activity_logs l
            where l.job_id = v_task.job_id
              and l.action_type = 'client_review_auto_moved'
              and l.meta ->> 'automation_key' = v_automation_key
        );

        job_id := v_task.job_id;
        previous_status := 'Client Review';
        new_status := 'awaiting_client';
        review_started_at := v_task.active_review_started_at;
        review_working_days := v_age;
        follow_up_owner := v_owner;
        follow_up_date := v_follow_up;
        action_taken := 'moved';
        return next;
    end loop;
end;
$$;

grant execute on function public.run_client_review_aging_check(timestamptz, boolean) to anon, authenticated;

-- Optional Supabase Cron setup. If pg_cron is unavailable, this block leaves
-- the function installed and the app's admin "Run Aging Check" fallback usable.
do $$
begin
    begin
        create extension if not exists pg_cron with schema extensions;
    exception when others then
        raise notice 'pg_cron is not available in this Supabase project: %', sqlerrm;
    end;

    if exists (select 1 from pg_extension where extname = 'pg_cron') then
        begin
            execute $cron$
                select cron.unschedule(jobid)
                from cron.job
                where jobname = 'creative-os-client-review-aging-hourly'
            $cron$;
        exception when others then
            raise notice 'No existing client review aging cron to unschedule, or cron schema unavailable: %', sqlerrm;
        end;

        begin
            execute $cron$
                select cron.schedule(
                    'creative-os-client-review-aging-hourly',
                    '0 * * * *',
                    $$select public.run_client_review_aging_check();$$
                )
            $cron$;
        exception when others then
            raise notice 'Client review aging function installed, but cron schedule could not be created: %', sqlerrm;
        end;
    end if;
end $$;

-- Safe test:
-- select * from public.run_client_review_aging_check(now(), true);
--
-- Manual run:
-- select * from public.run_client_review_aging_check();
--
-- Rollback schedule only:
-- select cron.unschedule(jobid)
-- from cron.job
-- where jobname = 'creative-os-client-review-aging-hourly';
