-- ============================================================================
-- Copied verbatim from repo root: supabase-team-review-hardening.sql
-- Revokes direct table access to team_review_responses; adds the RPC functions app.js actually calls.
-- ============================================================================

-- Run once in Supabase SQL Editor, AFTER supabase-team-review.sql, to stop team_review_responses
-- (the actual peer feedback content) from being readable/writable directly via the public anon key.
--
-- Why: this app has no real per-user login — every browser uses the same public anon key, and that
-- key is visible in app.js. Before this migration, anyone with devtools open could run
-- `supabaseClient.from('team_review_responses').select('*')` in the console and read every
-- reviewer's name, rating, and comments about everyone, with no review pass required at all.
--
-- What this does: revokes direct table access to team_review_responses and replaces it with three
-- SECURITY DEFINER functions that the app already calls (team_review_get_response,
-- team_review_submit, team_review_admin_list_responses). Each one re-checks the review pass hash
-- (or, for the admin listing function, is only ever called from the superadmin-gated Team Review
-- screen) before returning or writing anything.
--
-- Scope note: this does NOT add real per-user row security (that needs Supabase Auth). It closes
-- the "copy-paste a select('*') into devtools" attack, which is the realistic threat for an
-- internal tool like this. team_review_cycles and team_review_assignments are left as-is (pairing
-- metadata + hashed codes only, not the actual feedback content).

create extension if not exists pgcrypto;

revoke select, insert, update, delete on public.team_review_responses from anon, authenticated;

-- 1. Reviewer opens their pass -> resumes only the response tied to an assignment they can already
--    prove ownership of via a matching code hash. Never returns anyone else's response.
create or replace function public.team_review_get_response(p_assignment_id text, p_code_hashes text[])
returns setof public.team_review_responses
language sql
security definer
set search_path = public
as $$
    select r.*
    from public.team_review_responses r
    join public.team_review_assignments a on a.id = r.assignment_id
    where r.assignment_id = p_assignment_id
      and a.review_code_hash = any(p_code_hashes)
    limit 1;
$$;

-- 2. Reviewer submits -> validated server-side against the code hash (not just trusted from the
--    client), then writes the response and flips the assignment to submitted in one step.
create or replace function public.team_review_submit(
    p_response_id text,
    p_assignment_id text,
    p_code_hashes text[],
    p_ratings jsonb,
    p_comments jsonb,
    p_strengths text,
    p_improvements text,
    p_final_comment text,
    p_average_score numeric
)
returns table(assignment_id text, submitted_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
    v_assignment public.team_review_assignments;
    v_submitted_at timestamptz := now();
begin
    select * into v_assignment
    from public.team_review_assignments
    where id = p_assignment_id
      and review_code_hash = any(p_code_hashes)
    limit 1;

    if v_assignment.id is null then
        raise exception 'Invalid or expired review pass';
    end if;

    insert into public.team_review_responses (
        id, assignment_id, cycle_id, reviewer_name, reviewee_name,
        ratings, comments, strengths, improvements, final_comment, average_score, submitted_at
    ) values (
        p_response_id, v_assignment.id, v_assignment.cycle_id, v_assignment.reviewer_name, v_assignment.reviewee_name,
        coalesce(p_ratings, '{}'::jsonb), coalesce(p_comments, '{}'::jsonb), p_strengths, p_improvements, p_final_comment,
        p_average_score, v_submitted_at
    )
    on conflict (id) do update set
        ratings = excluded.ratings,
        comments = excluded.comments,
        strengths = excluded.strengths,
        improvements = excluded.improvements,
        final_comment = excluded.final_comment,
        average_score = excluded.average_score,
        submitted_at = excluded.submitted_at;

    update public.team_review_assignments
    set status = 'submitted', submitted_at = v_submitted_at
    where id = v_assignment.id;

    return query select v_assignment.id, v_submitted_at;
end;
$$;

-- 3. Admin dashboard (Team Review metrics + CSV export) reads every response through this single
--    named entrypoint instead of a bare table select. Called only from the app's superadmin-gated
--    screen — see the app-level note in fetchTeamReviewData() for the current limits of that gate.
create or replace function public.team_review_admin_list_responses()
returns setof public.team_review_responses
language sql
security definer
set search_path = public
as $$
    select * from public.team_review_responses order by submitted_at desc;
$$;

grant execute on function public.team_review_get_response(text, text[]) to anon, authenticated;
grant execute on function public.team_review_submit(text, text, text[], jsonb, jsonb, text, text, text, numeric) to anon, authenticated;
grant execute on function public.team_review_admin_list_responses() to anon, authenticated;

-- Force PostgREST/Supabase API to refresh schema cache immediately.
notify pgrst, 'reload schema';
