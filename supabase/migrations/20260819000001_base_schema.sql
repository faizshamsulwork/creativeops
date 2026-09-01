-- ============================================================================
-- Creative OS — base schema (LOCAL DEVELOPMENT ONLY)
-- ============================================================================
-- No SQL file in this repo creates creative_requests, team_members, clients,
-- team_leaves, or handover_logs — every other supabase-*.sql file in the repo root only ever
-- ALTERs them. They were originally created directly in the Supabase Studio table editor in
-- production, so this migration reverse-engineers them from two sources:
--   1. The actual production column list for creative_requests, confirmed by a read-only query
--      against the live REST API during the local/production separation + RLS audit
--      (2026-08-19): every column below except the ones added by later migrations in this folder.
--   2. Every field app.js actually reads from or writes to for team_members / clients /
--      team_leaves / handover_logs (grepped from app.js's .from('...') call sites).
--
-- This file intentionally does NOT include client_deadline / internal_due_date / client_review_* /
-- client_waiting_* / status_notes / etc. on creative_requests — those are added by the later
-- migrations in this folder, exactly mirroring how the schema is meant to evolve (some of those
-- migrations were, per the same audit, apparently never actually run against production — see the
-- report for details. Local intentionally gets the FULL intended schema so the whole feature set is
-- testable, even the parts production is currently missing).

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- creative_requests
-- ---------------------------------------------------------------------------
create table if not exists public.creative_requests (
    id bigint generated always as identity primary key,
    job_id text not null unique,
    requester_name text,
    region text,
    client_name text,
    project_title text,
    job_type text,
    objective text,
    brief text,
    deadline date,
    ref_link text,
    remarks text,
    status text not null default 'pending',
    assignee text default 'Unassigned',
    playbook_link text,
    work_status text default 'Not started',
    revision integer not null default 0,
    revision_reasons text,
    approver text,
    review_started_at timestamptz,
    last_moved_at timestamptz,
    done_at timestamptz,
    created_at timestamptz not null default now()
);

create index if not exists idx_creative_requests_job_id on public.creative_requests(job_id);
create index if not exists idx_creative_requests_status on public.creative_requests(status, work_status);
create index if not exists idx_creative_requests_created_at on public.creative_requests(created_at desc);

-- ---------------------------------------------------------------------------
-- team_members
-- ---------------------------------------------------------------------------
create table if not exists public.team_members (
    id bigint generated always as identity primary key,
    name text not null unique,
    region text,
    role text,
    team text,
    department text,
    is_creative boolean default false,
    status text default 'active',
    created_at timestamptz not null default now()
);

create index if not exists idx_team_members_name on public.team_members(name);
create index if not exists idx_team_members_region on public.team_members(region);

-- ---------------------------------------------------------------------------
-- clients
-- ---------------------------------------------------------------------------
create table if not exists public.clients (
    id bigint generated always as identity primary key,
    name text not null unique,
    region text,
    created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- team_leaves
-- ---------------------------------------------------------------------------
create table if not exists public.team_leaves (
    id bigint generated always as identity primary key,
    name text not null unique,
    status text,
    start_date text,
    end_date text,
    passcode text,
    updated_at timestamptz default now(),
    created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- handover_logs
-- ---------------------------------------------------------------------------
create table if not exists public.handover_logs (
    id bigint generated always as identity primary key,
    job_id text,
    requester_name text,
    takeover_pic text,
    working_file text,
    handover_notes text,
    created_at timestamptz not null default now()
);

create index if not exists idx_handover_logs_requester on public.handover_logs(requester_name);

-- ---------------------------------------------------------------------------
-- Grants — matches the current production access model: the app has no Supabase Auth, every
-- request uses the anon key, so anon needs full CRUD. See supabase-rls-hardening-PROPOSED.sql in
-- the repo root for the (not-yet-applied) hardening plan; this local setup deliberately mirrors
-- production's current (wide-open) behaviour rather than the aspirational one, so local dev
-- behaves the same way production actually does today.
-- ---------------------------------------------------------------------------
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.creative_requests to anon, authenticated;
grant select, insert, update, delete on public.team_members to anon, authenticated;
grant select, insert, update, delete on public.clients to anon, authenticated;
grant select, insert, update, delete on public.team_leaves to anon, authenticated;
grant select, insert, update, delete on public.handover_logs to anon, authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;

notify pgrst, 'reload schema';
