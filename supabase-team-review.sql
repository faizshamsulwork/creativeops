-- Run once in Supabase SQL Editor to enable shared Team Review cycles, private review codes, and review exports.
-- The app stores only a code hash in Supabase. Full private codes are shown to admin at creation time and kept in the admin browser vault.

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
