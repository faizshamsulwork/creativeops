-- Creative OS cross-region PIC visibility support
-- Run in Supabase SQL Editor only if assigned PICs still cannot read cross-region
-- tasks after deploying the front-end access fix.
--
-- Root idea:
-- 1. Store stable member/auth links on team_members where available.
-- 2. Backfill legacy comma-separated creative_requests.assignee into stable
--    assignment keys without deleting historical assignee text.
-- 3. If you later lock RLS with Supabase Auth, assigned PIC access must not
--    depend on the task region.
-- 4. Region is a display filter only. It is intentionally not used below as a
--    permission grant for regular creative members.

create extension if not exists pgcrypto;

alter table public.team_members
    add column if not exists email text,
    add column if not exists auth_user_id uuid,
    add column if not exists member_key text,
    add column if not exists is_active boolean default true,
    add column if not exists is_admin boolean default false,
    add column if not exists access_role text default 'member',
    add column if not exists access_level text default 'member';

update public.team_members
set member_key = coalesce(member_key, lower(regexp_replace(name, '\s+', ' ', 'g')))
where member_key is null
  and name is not null;

create index if not exists idx_team_members_member_key
    on public.team_members(member_key);

create index if not exists idx_team_members_auth_user_id
    on public.team_members(auth_user_id);

create index if not exists idx_team_members_email
    on public.team_members(lower(email));

alter table public.creative_requests
    add column if not exists assigned_pic_member_keys text[] default '{}',
    add column if not exists assigned_pic_auth_user_ids uuid[] default '{}',
    add column if not exists assignment_updated_at timestamptz;

update public.creative_requests cr
set assigned_pic_member_keys = coalesce((
    select array_agg(distinct tm.member_key)
    from regexp_split_to_table(coalesce(cr.assignee, ''), ',') raw_assignment(token)
    cross join lateral (
        select lower(regexp_replace(
            regexp_replace(
                regexp_replace(trim(raw_assignment.token), '^\[cover\]\s*', '', 'i'),
                '\s*\(for .*\)\s*$', '', 'i'
            ),
            '\s+',
            ' ',
            'g'
        )) as assignee_key
    ) parsed_assignment
    join public.team_members tm
      on tm.member_key = parsed_assignment.assignee_key
      or lower(regexp_replace(tm.name, '\s+', ' ', 'g')) = parsed_assignment.assignee_key
    where tm.member_key is not null
      and tm.is_active is distinct from false
), '{}')
where cr.assignee is not null
  and cr.assignee <> ''
  and (cr.assigned_pic_member_keys is null or cr.assigned_pic_member_keys = '{}');

update public.creative_requests cr
set assigned_pic_auth_user_ids = coalesce((
    select array_agg(distinct tm.auth_user_id)
    from public.team_members tm
    where tm.auth_user_id is not null
      and tm.member_key = any(coalesce(cr.assigned_pic_member_keys, '{}'))
), '{}')
where cr.assigned_pic_member_keys is not null
  and cr.assigned_pic_member_keys <> '{}'
  and (cr.assigned_pic_auth_user_ids is null or cr.assigned_pic_auth_user_ids = '{}');

create or replace function public.current_creative_os_member_keys()
returns text[]
language sql
stable
security definer
set search_path = public
as $$
    select coalesce(array_agg(distinct tm.member_key), '{}')
    from public.team_members tm
    where tm.member_key is not null
      and tm.is_active is distinct from false
      and (
          tm.auth_user_id = auth.uid()
          or lower(tm.email) = lower(coalesce(auth.email(), ''))
      );
$$;

create or replace function public.current_creative_os_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select exists (
        select 1
        from public.team_members tm
        where tm.is_active is distinct from false
          and (
              tm.auth_user_id = auth.uid()
              or lower(tm.email) = lower(coalesce(auth.email(), ''))
          )
          and (
              lower(coalesce(tm.access_role, '')) in ('admin', 'superadmin')
              or lower(coalesce(tm.access_level, '')) in ('admin', 'superadmin')
              or coalesce(tm.is_admin, false) = true
          )
    );
$$;

-- Optional RLS policy for a future Supabase Auth setup.
-- The current app still uses the anon browser model, so keep your existing anon
-- policies if they are required for the website to load.
alter table public.creative_requests enable row level security;

drop policy if exists "Creative OS read assigned or allowed task" on public.creative_requests;

create policy "Creative OS read assigned or allowed task"
    on public.creative_requests
    for select
    to authenticated
    using (
        public.current_creative_os_is_admin()
        or assigned_pic_member_keys && public.current_creative_os_member_keys()
        or auth.uid() = any(coalesce(assigned_pic_auth_user_ids, '{}'))
        or lower(regexp_replace(requester_name, '\s+', ' ', 'g')) = any(public.current_creative_os_member_keys())
    );

create index if not exists idx_creative_requests_assigned_pic_member_keys
    on public.creative_requests using gin(assigned_pic_member_keys);

create index if not exists idx_creative_requests_assigned_pic_auth_user_ids
    on public.creative_requests using gin(assigned_pic_auth_user_ids);

-- Related data tables should follow the same strict task relationship.
-- These policies are for Supabase Auth deployments; keep existing anon policies
-- only while the browser app still runs without Supabase Auth sessions.

create table if not exists public.task_note_logs (
    id uuid primary key default gen_random_uuid(),
    job_id text not null,
    actor_name text,
    note_text text not null,
    status_at_time text,
    created_at timestamptz default now()
);

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

alter table public.task_note_logs enable row level security;
alter table public.task_activity_logs enable row level security;

drop policy if exists "Creative OS read notes for authorised tasks" on public.task_note_logs;
drop policy if exists "Creative OS read activity for authorised tasks" on public.task_activity_logs;

create policy "Creative OS read notes for authorised tasks"
    on public.task_note_logs
    for select
    to authenticated
    using (
        exists (
            select 1
            from public.creative_requests cr
            where cr.job_id = task_note_logs.job_id
	              and (
	                  public.current_creative_os_is_admin()
	                  or cr.assigned_pic_member_keys && public.current_creative_os_member_keys()
	                  or auth.uid() = any(coalesce(cr.assigned_pic_auth_user_ids, '{}'))
	                  or lower(regexp_replace(cr.requester_name, '\s+', ' ', 'g')) = any(public.current_creative_os_member_keys())
	              )
        )
    );

create policy "Creative OS read activity for authorised tasks"
    on public.task_activity_logs
    for select
    to authenticated
    using (
        exists (
            select 1
            from public.creative_requests cr
            where cr.job_id = task_activity_logs.job_id
	              and (
	                  public.current_creative_os_is_admin()
	                  or cr.assigned_pic_member_keys && public.current_creative_os_member_keys()
	                  or auth.uid() = any(coalesce(cr.assigned_pic_auth_user_ids, '{}'))
	                  or lower(regexp_replace(cr.requester_name, '\s+', ' ', 'g')) = any(public.current_creative_os_member_keys())
	              )
        )
    );
