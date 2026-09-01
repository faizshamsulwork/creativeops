-- ============================================================================
-- Copied verbatim from repo root: supabase-team-review.sql
-- Creates team_review_cycles/assignments/responses.
-- ============================================================================

-- Run once in Supabase SQL Editor to enable shared Team Review cycles, private review passes, and review exports.
-- Required because reviewers on other laptops need Supabase records, not local-only browser storage.

create extension if not exists pgcrypto;

create table if not exists public.team_review_cycles (
    id text primary key,
    title text not null,
    status text default 'active',
    deadline date,
    created_by text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create table if not exists public.team_review_assignments (
    id text primary key,
    cycle_id text references public.team_review_cycles(id) on delete cascade,
    reviewer_name text not null,
    reviewer_region text,
    reviewee_name text not null,
    reviewee_region text,
    review_code_hash text not null,
    review_code_hint text,
    status text default 'pending',
    submitted_at timestamptz,
    created_at timestamptz default now()
);

create table if not exists public.team_review_responses (
    id text primary key,
    assignment_id text references public.team_review_assignments(id) on delete cascade,
    cycle_id text references public.team_review_cycles(id) on delete cascade,
    reviewer_name text not null,
    reviewee_name text not null,
    ratings jsonb default '{}'::jsonb,
    comments jsonb default '{}'::jsonb,
    strengths text,
    improvements text,
    final_comment text,
    average_score numeric,
    submitted_at timestamptz default now()
);

create index if not exists idx_team_review_cycles_created_at
    on public.team_review_cycles (created_at desc);

create index if not exists idx_team_review_assignments_cycle_status
    on public.team_review_assignments (cycle_id, status);

create index if not exists idx_team_review_assignments_code_hash
    on public.team_review_assignments (review_code_hash);

create index if not exists idx_team_review_responses_assignment
    on public.team_review_responses (assignment_id);

create index if not exists idx_team_review_responses_reviewee
    on public.team_review_responses (reviewee_name, submitted_at desc);

-- The current app uses the public anon key, so these grants are needed for the browser app to read pass hashes and submit reviews.
-- Privacy is enforced in the app UI/pass flow. For stronger database-level privacy later, move this flow to Supabase Auth or Edge Functions with RLS.
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.team_review_cycles to anon, authenticated;
grant select, insert, update, delete on public.team_review_assignments to anon, authenticated;
grant select, insert, update, delete on public.team_review_responses to anon, authenticated;

-- Keep RLS off for this no-login browser flow. Do not enable RLS unless matching policies/functions are added.
alter table public.team_review_cycles disable row level security;
alter table public.team_review_assignments disable row level security;
alter table public.team_review_responses disable row level security;

-- Force PostgREST/Supabase API to refresh schema cache immediately.
notify pgrst, 'reload schema';
