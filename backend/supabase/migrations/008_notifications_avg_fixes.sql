-- 008_notifications_avg_fixes.sql
-- Fix 1: Create notifications table (was used at runtime but never defined in migrations)
--         FK cascade on auth.users ensures rows are deleted when user is deleted
-- Fix 2: Clear cv_structured when CV is deleted or expires (AVG data minimisation)

-- ── Notifications table ───────────────────────────────────────────────────────
create table if not exists public.notifications (
    id            uuid primary key default gen_random_uuid(),
    user_id       uuid not null references auth.users(id) on delete cascade,
    type          text not null,
    reference_id  text,
    created_at    timestamptz not null default now()
);

-- Unique constraint used as a dedup guard: one notification per (user, type, period)
create unique index if not exists notifications_user_type_ref_uidx
    on public.notifications (user_id, type, reference_id);

-- RLS: users can read their own notifications; writes only via service role
alter table public.notifications enable row level security;

create policy "Users read own notifications"
    on public.notifications for select
    using (auth.uid() = user_id);

-- ── Fix cv_structured clearance on CV expiry ─────────────────────────────────
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
        -- Storage deletion is handled by a separate Edge Function.
        -- Also clear cv_structured so derived data doesn't outlive the source CV.
        update public.profiles
        set cv_path         = null,
            cv_expires_at   = null,
            cv_warning_sent = false,
            cv_structured   = null
        where id = rec.id;
    end loop;
end;
$$;
