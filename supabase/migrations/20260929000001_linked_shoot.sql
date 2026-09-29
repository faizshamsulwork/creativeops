-- ============================================================================
-- Linked Shooting requests (LOCAL DEVELOPMENT ONLY — production: supabase-linked-shoot-PRODUCTION.sql)
-- ============================================================================
-- creative_requests.parent_job_id — lets a Shooting ticket point at the Monthly Content Plan /
-- Ad-hoc ticket it's shooting for, so requesters fill one flow instead of two unrelated forms and
-- both tickets show each other in the detail modal. Nullable: standalone shoots (and every existing
-- row) simply have no parent. `on delete set null` so removing a content plan never cascades into
-- deleting the shoot.

alter table public.creative_requests
    add column if not exists parent_job_id text
        references public.creative_requests(job_id) on delete set null;

create index if not exists idx_creative_requests_parent_job on public.creative_requests(parent_job_id);

notify pgrst, 'reload schema';
