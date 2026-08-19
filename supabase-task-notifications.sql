-- Run once in Supabase SQL Editor to enable the Task Notes notification bell + @mentions.
-- Required because notifying an assignee/superadmin/@mentioned person when a note is added needs
-- a durable, per-recipient row (read/unread state, works across devices/reloads) — not just a
-- local toast that disappears the moment the tab closes.

create extension if not exists pgcrypto;

create table if not exists public.task_notifications (
    id text primary key,
    job_id text,
    client_name text,
    project_title text,
    recipient_name text not null,
    actor_name text,
    kind text default 'note_added', -- 'note_added' | 'mention'
    note_preview text,
    read_at timestamptz,
    created_at timestamptz default now()
);

create index if not exists idx_task_notifications_recipient
    on public.task_notifications (recipient_name, created_at desc);

create index if not exists idx_task_notifications_job
    on public.task_notifications (job_id);

-- The current app uses the public anon key with no login, so these grants are needed for the
-- browser app to write/read notifications. Privacy relies on the app only ever fetching rows
-- matching the signed-in profile's name — same trust model as every other table in this app.
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.task_notifications to anon, authenticated;

-- Keep RLS off, consistent with the rest of this no-login browser flow. Do not enable RLS unless
-- matching policies are added — the app has no auth session to check against.
alter table public.task_notifications disable row level security;

-- Add to realtime so the notification bell updates live without a page refresh. Idempotent —
-- safe to run even if supabase-realtime-all-tables.sql was already run (it doesn't cover this
-- table, added after that file).
do $$
begin
    if not exists (
        select 1 from pg_publication_tables
        where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'task_notifications'
    ) then
        alter publication supabase_realtime add table public.task_notifications;
    end if;
end $$;

-- Force PostgREST/Supabase API to refresh schema cache immediately.
notify pgrst, 'reload schema';
