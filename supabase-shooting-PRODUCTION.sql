-- ============================================================================
-- Shooting workflow — PRODUCTION migration (run this manually, once)
-- ============================================================================
-- This is the exact same schema already tested against Local Supabase throughout the Shooting
-- feature build (see supabase/migrations/20260826000001_shooting.sql) — copied here as a
-- standalone, one-time script because production is not linked to the Supabase CLI project used
-- for local dev, so `supabase migration up` cannot reach it.
--
-- HOW TO RUN:
--   1. Open the production project in the Supabase Dashboard.
--   2. Go to SQL Editor → New query.
--   3. Paste this whole file and click Run.
--   4. You should see "Success. No rows returned." Safe to re-run — every statement below is
--      idempotent (if not exists / create if not exists), so running it twice is a no-op the
--      second time, not an error or a duplicate.
--
-- WHAT THIS ADDS:
--   1. creative_requests.shoot_date       — real date column, same tier as `deadline`.
--   2. creative_requests.shoot_details    — jsonb bag for the rest of the shoot-specific structured
--                                            fields (call time, location, talent, props,
--                                            deliverables, optional details, readiness override).
--   3. shoot_checklist_items              — one row per checklist item a user has actually touched.
--                                            Item labels/critical-flags/owner-hints live in a static
--                                            JS config (SHOOT_CHECKLIST_DEFS in app.js), not here.
--
-- ACCESS MODEL NOTE: the grants below give anon/authenticated full read/write on the new table.
-- That matches every other table in this production schema today (see
-- supabase-rls-hardening-PROPOSED.sql for the full audit) — it does not introduce a new gap, it
-- just doesn't fix the pre-existing one. That hardening is a separate, not-yet-applied piece of
-- work and is intentionally out of scope here.
--
-- Until this is run, the rest of the app (Ad-hoc, Monthly, Pitch Deck, Dashboard, Board, etc.) is
-- completely unaffected — only the new Shooting request type will fail to submit/save.

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
