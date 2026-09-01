-- ============================================================================
-- Copied verbatim from repo root: supabase-task-notes-edit-delete.sql
-- Adds task_note_logs.edited_at.
-- ============================================================================

-- Run once in Supabase SQL Editor to let the app edit/delete task notes in place.
-- Required for the "I typed/tagged the wrong thing" fix — without this column the app has
-- nowhere to record that a note's text was changed after the fact.

alter table public.task_note_logs add column if not exists edited_at timestamptz;

-- Force PostgREST/Supabase API to refresh schema cache immediately.
notify pgrst, 'reload schema';
