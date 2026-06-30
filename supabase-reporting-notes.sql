-- Run once in Supabase SQL Editor to make public task notes and reporting export fully shared.
create extension if not exists pgcrypto;

alter table public.creative_requests
    add column if not exists status_notes text;

create table if not exists public.task_note_logs (
    id uuid primary key default gen_random_uuid(),
    job_id text not null,
    actor_name text,
    note_text text not null,
    status_at_time text,
    created_at timestamptz default now()
);

create index if not exists idx_task_note_logs_job_id_created_at
    on public.task_note_logs (job_id, created_at desc);

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

create index if not exists idx_task_activity_logs_job_id_created_at
    on public.task_activity_logs (job_id, created_at desc);
