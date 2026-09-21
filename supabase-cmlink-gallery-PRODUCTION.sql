-- ============================================================================
-- Style Gallery (cmlink_gallery_images) — PRODUCTION migration (run this manually, once)
-- ============================================================================
-- Same schema already tested against Local Supabase throughout the Style Gallery build (see
-- supabase/migrations/20260915000001_cmlink_gallery.sql and
-- supabase/migrations/20260915000002_cmlink_gallery_cloudinary.sql) — copied here as a
-- standalone, one-time script because production is not linked to the Supabase CLI project used
-- for local dev, so `supabase migration up` cannot reach it. This already includes the local
-- rename from Imgur's delete-hash column to Cloudinary's public_id (the app switched image hosts
-- during local development, before this ever shipped) — production just gets the final schema
-- directly, no need to replay that history.
--
-- HOW TO RUN:
--   1. Open the production project in the Supabase Dashboard.
--   2. Go to SQL Editor → New query.
--   3. Paste this whole file and click Run.
--   4. You should see "Success. No rows returned." Safe to re-run — every statement below is
--      idempotent (if not exists / create if not exists), so running it twice is a no-op the
--      second time, not an error or a duplicate.
--
-- WHAT THIS ADDS:
--   cmlink_gallery_images — one row per uploaded image. The images themselves live on Cloudinary
--   (not Supabase Storage — deliberate, keeps this feature off the production project's storage/
--   egress budget, which was already tight before this feature existed), this table just indexes
--   the Cloudinary URL + metadata needed to browse it.
--
--   There is no separate "picks/selections" table here — an earlier version of this feature had
--   one (team-wide "picked" marking), but it was replaced by the current multi-select + bulk .zip
--   download before shipping, so nothing in the app reads or writes a selections table anymore.
--
-- ACCESS MODEL NOTE: the grants below give anon/authenticated full read/write on the new table.
-- That matches every other table in this production schema today (see
-- supabase-rls-hardening-PROPOSED.sql for the full audit) — it does not introduce a new gap, it
-- just doesn't fix the pre-existing one. That hardening is a separate, not-yet-applied piece of
-- work and is intentionally out of scope here.
--
-- Until this is run, the rest of the app is completely unaffected — only the new Style Gallery
-- page will fail to load/upload (it will show a "Failed to load gallery data" toast).

create table if not exists public.cmlink_gallery_images (
    id bigint generated always as identity primary key,
    category text not null check (category in ('Female', 'Male', 'Group of Friends', 'Phone')),
    shot_type text not null,
    label text,
    image_url text not null,
    cloudinary_public_id text,
    added_by text not null,
    added_at timestamptz not null default now()
);

create index if not exists idx_cmlink_gallery_images_category_shot
    on public.cmlink_gallery_images(category, shot_type);

grant select, insert, update, delete on public.cmlink_gallery_images to anon, authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;

do $$
begin
    if not exists (
        select 1 from pg_publication_tables
        where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'cmlink_gallery_images'
    ) then
        alter publication supabase_realtime add table public.cmlink_gallery_images;
    end if;
end $$;

notify pgrst, 'reload schema';
