-- ============================================================================
-- Linked Shooting requests — PRODUCTION migration (run this manually, once)
-- ============================================================================
-- Same schema as supabase/migrations/20260929000001_linked_shoot.sql (tested on Local Supabase).
--
-- HOW TO RUN:
--   1. Open the production project in the Supabase Dashboard.
--   2. Go to SQL Editor → New query.
--   3. Paste this whole file and click Run.
--   4. Expect "Success. No rows returned." Safe to re-run — every statement is idempotent.
--
-- WHAT THIS ADDS:
--   creative_requests.parent_job_id — a Shooting ticket's link to the Monthly Content Plan / Ad-hoc
--   ticket it belongs to. Nullable; existing rows are untouched (they stay standalone).
--
-- REQUIRES: the job_id unique constraint added by supabase-shooting-PRODUCTION.sql (run that first
-- if it hasn't been).
--
-- Until this is run, the app keeps working: request submission strips parent_job_id and retries
-- when the column is missing, so tickets are still created — just without the link.

alter table public.creative_requests
    add column if not exists parent_job_id text
        references public.creative_requests(job_id) on delete set null;

create index if not exists idx_creative_requests_parent_job on public.creative_requests(parent_job_id);

notify pgrst, 'reload schema';
