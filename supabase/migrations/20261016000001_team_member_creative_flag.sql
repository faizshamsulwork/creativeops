-- Shared "Creative" flag for team members.
-- Until now Settings > Role = Creative was only remembered in the browser that set it
-- (localStorage), so other admins' Assign lists were missing those creatives.
alter table public.team_members
    add column if not exists is_creative boolean not null default false;

update public.team_members
set is_creative = true
where name in (
    'Aaron', 'Abel', 'Alya', 'Simon', 'Steven', 'Faiz Shamsul', 'Liew Hui Yin',
    'Annisya Y.', 'Youke Yap', 'Herdina Syaki', 'Nabila N.'
);
