-- Migration 004: writing_style on profiles, cv_warning_sent flag,
--               last_active_at for 90-day inactivity rule,
--               pg_cron jobs for AVG auto-delete obligations.
-- Run after 003_abuse_and_suspension.sql

-- ── New columns ───────────────────────────────────────────────────────────────
alter table public.profiles
    add column if not exists writing_style    text    not null default 'formeel',
    add column if not exists cv_warning_sent  boolean not null default false,
    add column if not exists last_active_at   timestamptz not null default now();

-- ── pg_cron: daily CV expiry check (runs 02:00 UTC) ─────────────────────────
-- Requires pg_cron extension enabled in Supabase dashboard → Database → Extensions.

select cron.schedule(
    'cv-expiry-daily',
    '0 2 * * *',   -- every day at 02:00 UTC
    $$
    -- 1. Mark "warning sent" for CVs expiring within 7 days (handled by Edge Function trigger).
    --    We only update the flag here; the actual email is sent by the warn-cv-expiry Edge Function
    --    which listens to this flag via a Supabase webhook/scheduled invocation.
    update public.profiles
    set cv_warning_sent = true
    where cv_expires_at is not null
      and cv_expires_at > now()
      and cv_expires_at <= now() + interval '7 days'
      and cv_warning_sent = false;

    -- 2. Hard-delete expired CVs from storage. We call a helper function defined below.
    select opstap_delete_expired_cvs();
    $$
);

select cron.schedule(
    'inactivity-purge-weekly',
    '0 3 * * 0',   -- every Sunday at 03:00 UTC
    $$
    -- AVG rule 6: delete all user data after 90 days of inactivity.
    -- auth.users deletion cascades to profiles and applications via FK on delete cascade.
    select opstap_purge_inactive_users();
    $$
);

-- ── Helper: delete expired CV files + clear cv columns ───────────────────────
create or replace function opstap_delete_expired_cvs()
returns void language plpgsql security definer as $$
declare
    rec record;
begin
    for rec in
        select id, user_id, cv_path
        from public.profiles
        where cv_expires_at is not null
          and cv_expires_at <= now()
          and cv_path is not null
    loop
        -- Storage deletion must be done via service role from outside Postgres.
        -- We clear the columns here and let a separate Edge Function handle storage.
        update public.profiles
        set cv_path        = null,
            cv_expires_at  = null,
            cv_warning_sent = false
        where id = rec.id;
    end loop;
end;
$$;

-- ── Helper: purge inactive users ─────────────────────────────────────────────
create or replace function opstap_purge_inactive_users()
returns void language plpgsql security definer as $$
declare
    rec record;
begin
    for rec in
        select user_id
        from public.profiles
        where last_active_at < now() - interval '90 days'
    loop
        -- Deleting from auth.users cascades to profiles + applications via FK.
        -- auth.admin.deleteUser is not available in SQL; mark for deletion instead.
        -- A companion Edge Function (purge-inactive) runs weekly and calls admin.deleteUser
        -- for each user_id in this staging table.
        insert into public.deletion_queue (user_id, reason, queued_at)
        values (rec.user_id, 'inactivity_90d', now())
        on conflict (user_id) do nothing;
    end loop;
end;
$$;

-- ── Deletion queue (for auth-level deletes that need service role) ────────────
create table if not exists public.deletion_queue (
    user_id    uuid primary key references auth.users(id) on delete cascade,
    reason     text not null,
    queued_at  timestamptz not null default now()
);

-- Only service role can read/write — no RLS policies = all client access denied
alter table public.deletion_queue enable row level security;
