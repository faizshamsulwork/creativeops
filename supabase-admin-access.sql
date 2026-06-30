-- Run once in Supabase SQL Editor to make admin access editable from Settings.
alter table public.team_members
    add column if not exists is_admin boolean default false,
    add column if not exists access_role text default 'member';

update public.team_members
set is_admin = true, access_role = 'superadmin'
where lower(name) = lower('Faiz Shamsul');
