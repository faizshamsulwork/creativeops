-- ============================================================================
-- Local development seed data — SYNTHETIC ONLY. No production data of any kind.
-- ============================================================================
-- Auto-applied by `supabase db reset` after all migrations run (including the Auth + RLS migration,
-- 20260819000013_local_auth_rls.sql). Every name/email/client/task below is fictional, invented for
-- this seed file. Includes 5 real local Supabase Auth accounts (one per required role) so RLS can
-- actually be exercised — auth.users/auth.identities seeding is Supabase's own documented local-dev
-- pattern (password-based here, purely so the adversarial test script in the report can obtain a
-- JWT per role with a plain curl call; the app's real login flow uses email OTP instead — see
-- app.js's startApp()/completeAuthLogin() — these passwords are a LOCAL TESTING CONVENIENCE ONLY,
-- never used by the app's own UI, and meaningless outside this throwaway local database).

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- 1. Auth users — one per required role. Fixed UUIDs so the rest of this file (and any test
--    script) can reference them without a round-trip.
-- ---------------------------------------------------------------------------
do $$
declare
    v_instance uuid := '00000000-0000-0000-0000-000000000000';
    v_password text := 'local-dev-test-only-not-a-real-password';
    v_users jsonb := '[
        {"id": "10000000-0000-0000-0000-000000000001", "email": "superadmin.test@local.dev", "name": "Superadmin Test"},
        {"id": "10000000-0000-0000-0000-000000000002", "email": "admin.test@local.dev", "name": "Admin Test"},
        {"id": "10000000-0000-0000-0000-000000000003", "email": "creativea.test@local.dev", "name": "Creative A Test"},
        {"id": "10000000-0000-0000-0000-000000000004", "email": "creativeb.test@local.dev", "name": "Creative B Test"},
        {"id": "10000000-0000-0000-0000-000000000005", "email": "requester.test@local.dev", "name": "Requester Test"}
    ]'::jsonb;
    v_user jsonb;
begin
    for v_user in select * from jsonb_array_elements(v_users) loop
        insert into auth.users (
            instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token,
            recovery_token, email_change_token_new, email_change
        ) values (
            v_instance,
            (v_user->>'id')::uuid,
            'authenticated',
            'authenticated',
            v_user->>'email',
            crypt(v_password, gen_salt('bf')),
            now(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            jsonb_build_object('name', v_user->>'name'),
            now(),
            now(),
            '', '', '', ''
        )
        on conflict (id) do nothing;

        insert into auth.identities (
            id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
        ) values (
            gen_random_uuid(),
            v_user->>'id',
            (v_user->>'id')::uuid,
            jsonb_build_object('sub', v_user->>'id', 'email', v_user->>'email'),
            'email',
            now(), now(), now()
        )
        on conflict (provider_id, provider) do nothing;
    end loop;
end $$;

-- ---------------------------------------------------------------------------
-- 2. team_members — one row per role, linked to its auth.users row via auth_user_id.
-- ---------------------------------------------------------------------------
insert into public.team_members (name, region, role, team, department, is_creative, status, email, auth_user_id, member_key, is_active, is_admin, access_role)
values
    ('Superadmin Test', 'Malaysia', 'Admin', 'Admin', 'Requester', false, 'active', 'superadmin.test@local.dev', '10000000-0000-0000-0000-000000000001', 'superadmin test', true, true, 'superadmin'),
    ('Admin Test',       'Malaysia', 'Admin', 'Admin', 'Requester', false, 'active', 'admin.test@local.dev',       '10000000-0000-0000-0000-000000000002', 'admin test',       true, true, 'admin'),
    ('Creative A Test',  'Malaysia', 'Creative', 'Creative', 'Creative', true, 'active', 'creativea.test@local.dev', '10000000-0000-0000-0000-000000000003', 'creative a test',  true, false, 'member'),
    ('Creative B Test',  'Indonesia', 'Creative', 'Creative', 'Creative', true, 'active', 'creativeb.test@local.dev', '10000000-0000-0000-0000-000000000004', 'creative b test',  true, false, 'member'),
    ('Requester Test',   'Malaysia', 'Requester', 'Requester', 'Requester', false, 'active', 'requester.test@local.dev', '10000000-0000-0000-0000-000000000005', 'requester test',   true, false, 'member')
on conflict (name) do update set
    email = excluded.email,
    auth_user_id = excluded.auth_user_id,
    member_key = excluded.member_key,
    is_active = excluded.is_active,
    is_admin = excluded.is_admin,
    access_role = excluded.access_role;

-- current_creative_os_is_admin() also checks SUPER_ADMIN_NAMES-equivalent logic isn't needed here —
-- access_role above already covers both Admin Test and Superadmin Test.

-- ---------------------------------------------------------------------------
-- 3. clients
-- ---------------------------------------------------------------------------
insert into public.clients (name, region)
values
    ('Sample Client Sdn Bhd', 'Malaysia'),
    ('Contoh Client Indonesia', 'Indonesia')
on conflict (name) do nothing;

-- ---------------------------------------------------------------------------
-- 4. creative_requests — deliberately shaped to exercise every RLS test in the report:
--    - RLS-A-001:        assigned to Creative A, requested by Requester Test (Creative A's own task)
--    - RLS-B-001:        assigned to Creative B only (Creative A must NOT be able to see/update this)
--    - RLS-XREGION-001:  region = Indonesia, assigned to Creative A (whose home region is Malaysia)
--                        — proves cross-region assignment still grants access
--    - RLS-REQ-001:      requested by Requester Test, unassigned (the requester's own request)
--    - RLS-OTHER-001:    requested by a DIFFERENT requester — Requester Test must NOT see this
-- ---------------------------------------------------------------------------
insert into public.creative_requests (job_id, requester_name, region, client_name, project_title, job_type, objective, brief, deadline, status, assignee, work_status, assigned_pic_member_keys)
values
    ('RLS-A-001', 'Requester Test', 'Malaysia', 'Sample Client Sdn Bhd', 'RLS test — Creative A own task', 'Ad-hoc / One-off', 'Awareness', 'Synthetic RLS test task.', current_date + 7, 'approved', 'Creative A Test', 'Drafting', array['creative a test']),
    ('RLS-B-001', 'Requester Test', 'Malaysia', 'Sample Client Sdn Bhd', 'RLS test — Creative B only task', 'Ad-hoc / One-off', 'Awareness', 'Synthetic RLS test task.', current_date + 7, 'approved', 'Creative B Test', 'Drafting', array['creative b test']),
    ('RLS-XREGION-001', 'Requester Test', 'Indonesia', 'Contoh Client Indonesia', 'RLS test — cross region assignment', 'Ad-hoc / One-off', 'Awareness', 'Synthetic RLS test task — Creative A (home region Malaysia) assigned to an Indonesia-region task.', current_date + 7, 'approved', 'Creative A Test', 'Drafting', array['creative a test']),
    ('RLS-REQ-001', 'Requester Test', 'Malaysia', 'Sample Client Sdn Bhd', 'RLS test — requester own request', 'Ad-hoc / One-off', 'Awareness', 'Synthetic RLS test task.', current_date + 7, 'pending', 'Unassigned', 'Not started', array[]::text[]),
    ('RLS-OTHER-001', 'Dev Requester', 'Malaysia', 'Sample Client Sdn Bhd', 'RLS test — another requester''s request', 'Ad-hoc / One-off', 'Awareness', 'Synthetic RLS test task — must be invisible to Requester Test.', current_date + 7, 'pending', 'Unassigned', 'Not started', array[]::text[])
on conflict (job_id) do nothing;

-- A note + activity log row on RLS-B-001, to test that child rows disappear along with their
-- inaccessible parent task.
insert into public.task_note_logs (job_id, actor_name, note_text, status_at_time)
values ('RLS-B-001', 'Creative B Test', 'Synthetic note — should be invisible unless you can see RLS-B-001.', 'Drafting')
on conflict do nothing;

insert into public.task_activity_logs (job_id, action_type, actor_name, old_value, new_value)
values ('RLS-B-001', 'status_changed', 'Creative B Test', 'Not started', 'Drafting')
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Legacy generic dev fixtures (kept from the earlier schema-only local setup, harmless alongside
-- the RLS test rows above — not linked to any auth account, so RLS now correctly hides these from
-- everyone except an admin, which is expected).
-- ---------------------------------------------------------------------------
insert into public.team_members (name, region, role, team, department, is_creative, status)
values ('Dev Requester', 'Malaysia', 'Requester', 'Requester', 'Requester', false, 'active')
on conflict (name) do nothing;

insert into public.creative_requests (job_id, requester_name, region, client_name, project_title, job_type, objective, brief, deadline, status, assignee, work_status)
values ('DEV-2601-002', 'Dev Requester', 'Indonesia', 'Contoh Client Indonesia', 'Sample Monthly Content', 'Monthly Plan', 'Traffic', 'Synthetic monthly-plan task for local testing.', current_date + 14, 'pending', 'Unassigned', 'Not started')
on conflict (job_id) do nothing;
