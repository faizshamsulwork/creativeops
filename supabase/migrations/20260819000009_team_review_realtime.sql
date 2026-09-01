-- ============================================================================
-- Copied verbatim from repo root: supabase-team-review-realtime.sql
-- Adds team_review_* tables to the realtime publication (superseded by 000012 below, kept for parity with the repo's own file set).
-- ============================================================================

-- Run once in Supabase SQL Editor, AFTER supabase-team-review.sql and supabase-team-review-hardening.sql,
-- to make Team Review changes push live to every open browser (admin dashboard, reviewer screens).
--
-- Why: the app already listens for postgres_changes on team_review_cycles/assignments/responses
-- (see setupRealtimeSubscription() in app.js), but that listener only fires for tables that are
-- part of the "supabase_realtime" publication. None of the earlier Team Review SQL files added
-- these 3 tables to it, so changes were saved correctly but never pushed live — you'd only see them
-- after a manual refresh, a tab switch, or reopening the page.
--
-- This is idempotent — safe to run more than once, it skips any table already added.

do $$
begin
    if not exists (
        select 1 from pg_publication_tables
        where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'team_review_cycles'
    ) then
        alter publication supabase_realtime add table public.team_review_cycles;
    end if;

    if not exists (
        select 1 from pg_publication_tables
        where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'team_review_assignments'
    ) then
        alter publication supabase_realtime add table public.team_review_assignments;
    end if;

    if not exists (
        select 1 from pg_publication_tables
        where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'team_review_responses'
    ) then
        alter publication supabase_realtime add table public.team_review_responses;
    end if;
end $$;
