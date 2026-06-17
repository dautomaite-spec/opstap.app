-- 009_beta_invite_waitlist.sql
-- Beta invite codes and waitlist for controlled rollout

-- ── Invite codes ──────────────────────────────────────────────────────────────
create table if not exists public.invite_codes (
    id           uuid primary key default gen_random_uuid(),
    code         text not null unique,
    notes        text,                          -- admin label, e.g. "LinkedIn post batch 1"
    max_uses     int not null default 1,
    use_count    int not null default 0,
    created_at   timestamptz not null default now(),
    expires_at   timestamptz
);

-- Track which user redeemed which code
create table if not exists public.invite_uses (
    id           uuid primary key default gen_random_uuid(),
    code_id      uuid not null references public.invite_codes(id) on delete cascade,
    user_id      uuid not null references auth.users(id) on delete cascade,
    used_at      timestamptz not null default now(),
    unique (user_id)   -- one redemption per user
);

-- ── Waitlist ──────────────────────────────────────────────────────────────────
create table if not exists public.waitlist (
    id           uuid primary key default gen_random_uuid(),
    email        text not null unique,
    naam         text,
    created_at   timestamptz not null default now(),
    invited_at   timestamptz,
    invite_code  text       -- set when admin sends an invite
);

-- RLS: no public read — admin only via service role
alter table public.invite_codes enable row level security;
alter table public.invite_uses  enable row level security;
alter table public.waitlist     enable row level security;

-- Users can read their own invite use (to show "invited by" info later)
create policy "Users read own invite use"
    on public.invite_uses for select
    using (auth.uid() = user_id);
