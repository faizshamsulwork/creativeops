-- Run once in Supabase SQL Editor to make EVERY table the app listens to push live to open
-- browsers — including request/task status (creative_requests), not just Team Review.
--
-- Why: app.js's setupRealtimeSubscription() already registers a postgres_changes listener for
-- all 8 tables below, but a listener only fires for tables that are part of the
-- "supabase_realtime" publication. Some of these may have been enabled already via the Supabase
-- Dashboard (Database → Replication) when the app was first built — none of the SQL files in this
-- repo ever did it via SQL before supabase-team-review-realtime.sql, which only covered the 3
-- team_review_* tables. This file supersedes that one — safe to run even if you already ran it.
--
-- This is idempotent — safe to run more than once, it skips any table already added.

do $$
begin
    if not exists (
        select 1 from pg_publication_tables
        where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'creative_requests'
    ) then
        alter publication supabase_realtime add table public.creative_requests;
    end if;

    if not exists (
        select 1 from pg_publication_tables
        where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'team_leaves'
    ) then
        alter publication supabase_realtime add table public.team_leaves;
    end if;

    if not exists (
        select 1 from pg_publication_tables
        where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'handover_logs'
    ) then
        alter publication supabase_realtime add table public.handover_logs;
    end if;

    if not exists (
        select 1 from pg_publication_tables
        where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'task_activity_logs'
    ) then
        alter publication supabase_realtime add table public.task_activity_logs;
    end if;

    if not exists (
        select 1 from pg_publication_tables
        where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'task_client_waiting_periods'
    ) then
        alter publication supabase_realtime add table public.task_client_waiting_periods;
    end if;

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

-- Quick way to check what's actually enabled right now, any time:
-- select tablename from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' order by 1;
