-- ============================================================================
-- Adapted from repo root: supabase-cross-region-pic-visibility.sql
-- ============================================================================
-- ADAPTED, not verbatim: the original file also runs `alter table ... enable row level security`
-- on creative_requests / task_note_logs / task_activity_logs, with a SELECT policy scoped
-- `to authenticated` only (and no `anon` policy at all). This app has zero Supabase Auth
-- integration — every request, local or production, uses the anon key — so enabling RLS with only
-- an `authenticated` policy would make every one of these tables return ZERO rows to the app,
-- which is a worse local-dev failure than the 404s this setup is fixing. That specific RLS-enabling
-- part is excluded here on purpose. It's preserved (properly designed for a future real-auth setup)
-- in supabase-rls-hardening-PROPOSED.sql in the repo root — see that file before ever running it.
--
-- Confirmed via the same production audit that this file — including the parts kept below — was
-- never actually applied to production (current_creative_os_member_keys() and
-- assigned_pic_member_keys do not exist live). Included here anyway because local should have the
-- FULL schema the frontend/repo were designed for, not just what production happens to have today.

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

create index if not exists idx_creative_requests_assigned_pic_member_keys
    on public.creative_requests using gin(assigned_pic_member_keys);

create index if not exists idx_creative_requests_assigned_pic_auth_user_ids
    on public.creative_requests using gin(assigned_pic_auth_user_ids);

-- task_note_logs / task_activity_logs already exist by this point (see 000003_reporting_notes.sql)
-- — these are harmless no-ops kept only for fidelity with the original file.
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

-- RLS intentionally NOT enabled here — see header note. Grant anon/authenticated full access on
-- the two log tables, matching production's actual (wide-open) current behaviour.
grant select, insert, update, delete on public.task_note_logs to anon, authenticated;
grant select, insert, update, delete on public.task_activity_logs to anon, authenticated;

notify pgrst, 'reload schema';
