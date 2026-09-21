-- ============================================================================
-- CMLink Style Gallery (LOCAL DEVELOPMENT ONLY)
-- ============================================================================
-- Adds the schema for the CMLink talent-casting gallery module:
--   1. cmlink_gallery_images       — one row per uploaded image. Images themselves live on
--                                     Imgur (not Supabase Storage — deliberate, see report: keeps
--                                     this feature off the 1GB storage / 5GB egress free-tier caps
--                                     the rest of the project is already tight on), this table just
--                                     indexes the Imgur URL + metadata needed to browse/manage it.
--   2. cmlink_gallery_selections   — team-wide "picks". A row's presence = picked; no row = not
--                                     picked. One row per image (not per user) because picks are
--                                     shared across the whole team, matching the prototype's
--                                     behavior, but unlike the prototype we now have a real
--                                     `picked_by` since this module requires a platform identity.
--
-- The 33 prompts themselves are NOT a table — they're static seed data in cmlink-gallery-data.js
-- (see that file). They're fixed, hand-tuned text that rarely changes, so a static file avoids a
-- DB read every time someone opens the Prompts tab (same egress-conscious reasoning as above).
--
-- Apply locally with: npx supabase migration up   (NOT `db reset` — preserves existing local data)
-- Production is NOT touched by this file — local development only, per explicit instruction.

create table if not exists public.cmlink_gallery_images (
    id bigint generated always as identity primary key,
    category text not null check (category in ('Female', 'Male', 'Group of Friends', 'Phone')),
    shot_type text not null,
    label text,
    image_url text not null,
    imgur_delete_hash text,
    added_by text not null,
    added_at timestamptz not null default now()
);

create index if not exists idx_cmlink_gallery_images_category_shot
    on public.cmlink_gallery_images(category, shot_type);

create table if not exists public.cmlink_gallery_selections (
    image_id bigint primary key references public.cmlink_gallery_images(id) on delete cascade,
    picked_by text not null,
    picked_at timestamptz not null default now()
);

-- Matches the current (wide-open, no-Auth) access model used by every other table in this local
-- schema — see base_schema.sql's grants comment for why. Worth revisiting together with the
-- pending RLS hardening pass (supabase-rls-hardening-PROPOSED.sql) rather than inventing a
-- one-off stricter model for just these two tables.
grant select, insert, update, delete on public.cmlink_gallery_images to anon, authenticated;
grant select, insert, update, delete on public.cmlink_gallery_selections to anon, authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;

do $$
begin
    if not exists (
        select 1 from pg_publication_tables
        where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'cmlink_gallery_images'
    ) then
        alter publication supabase_realtime add table public.cmlink_gallery_images;
    end if;
    if not exists (
        select 1 from pg_publication_tables
        where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'cmlink_gallery_selections'
    ) then
        alter publication supabase_realtime add table public.cmlink_gallery_selections;
    end if;
end $$;

notify pgrst, 'reload schema';
