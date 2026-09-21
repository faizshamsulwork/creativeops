-- ============================================================================
-- CMLink Style Gallery — switch image host from Imgur to Cloudinary (LOCAL DEV ONLY)
-- ============================================================================
-- Imgur's "create an app" flow turned out to be more friction than it was worth (confusing
-- authorization-type step, and it only hands out a 10-minute delete token for images uploaded
-- without a registered app anyway). Cloudinary's unsigned-upload-preset flow needs no secret at
-- all client-side and has a much bigger free tier (25GB storage / 25GB bandwidth vs. Imgur's
-- tightening limits) — see the report for the full comparison.
--
-- Cloudinary doesn't give unsigned uploads a durable delete token either (its delete_token also
-- expires after ~10 minutes), so `imgur_delete_hash` is renamed to `cloudinary_public_id` — kept
-- as metadata (useful if a server-side cleanup script with the Cloudinary API secret is ever
-- written) rather than used for an automatic delete-on-remove call like Imgur's was.
--
-- Apply locally with: npx supabase migration up

alter table public.cmlink_gallery_images
    rename column imgur_delete_hash to cloudinary_public_id;

notify pgrst, 'reload schema';
