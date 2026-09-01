-- ============================================================================
-- Shooting workflow (LOCAL DEVELOPMENT ONLY)
-- ============================================================================
-- Adds the minimum schema needed for the Shooting request type:
--   1. creative_requests.shoot_date       — real date column, same tier as `deadline` (useful for
--                                            future sorting/calendar work; not wired into Calendar
--                                            in this change).
--   2. creative_requests.shoot_details    — jsonb bag for the rest of the shoot-specific structured
--                                            fields (call time, location, talent, props,
--                                            deliverables, optional details, readiness override).
--                                            Deliberately NOT one column per field — see the report
--                                            for why (mirrors the existing task_activity_logs.meta /
--                                            team_review_responses.ratings jsonb precedent instead of
--                                            adding a dozen booleans).
--   3. shoot_checklist_items              — one row per checklist item a user has actually touched.
--                                            Item labels/critical-flags/owner-hints live in a static
--                                            JS config (SHOOT_CHECKLIST_DEFS in app.js), not here —
--                                            this table only tracks state, same split the app already
--                                            uses for job-type checkboxes vs their DB representation.
--
-- Apply locally with: supabase migration up   (NOT `db reset` — preserves existing local data)
-- Production equivalent is NOT applied here — see the final report for the exact production
-- migration this implies.

alter table public.creative_requests
    add column if not exists shoot_date date,
    add column if not exists shoot_details jsonb not null default '{}'::jsonb;

create table if not exists public.shoot_checklist_items (
    id bigint generated always as identity primary key,
    job_id text not null references public.creative_requests(job_id) on delete cascade,
    phase text not null check (phase in ('before', 'shoot_day', 'post')),
    item_key text not null,
    completed boolean not null default false,
    owner text,
    note text,
    completed_by text,
    completed_at timestamptz,
    updated_at timestamptz not null default now(),
    created_at timestamptz not null default now(),
    unique (job_id, phase, item_key)
);

create index if not exists idx_shoot_checklist_items_job on public.shoot_checklist_items(job_id);

-- Matches the current (wide-open, no-Auth) access model used by every other table in this local
-- schema — see base_schema.sql's grants comment for why.
grant select, insert, update, delete on public.shoot_checklist_items to anon, authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;

do $$
begin
    if not exists (
        select 1 from pg_publication_tables
        where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'shoot_checklist_items'
    ) then
        alter publication supabase_realtime add table public.shoot_checklist_items;
    end if;
end $$;

notify pgrst, 'reload schema';
