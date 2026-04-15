-- Opstap initial schema
-- Run this in the Supabase SQL editor (EU region project)
-- All tables use RLS — service role key bypasses for backend calls

-- ─── Extensions ────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── Profiles ───────────────────────────────────────────────────────────────
create table public.profiles (
    id              uuid primary key default uuid_generate_v4(),
    user_id         uuid not null references auth.users(id) on delete cascade,
    naam            text not null,
    woonplaats      text,
    functietitel    text,
    open_voor_alles boolean not null default false,
    beschikbaarheid text,                   -- fulltime / parttime / both
    uren_per_week   int,
    salaris_min     int,
    salaris_max     int,
    werklocatie     text,                   -- on-site / hybrid / remote
    extra_info      text,
    cv_path         text,                   -- Supabase Storage path
    cv_expires_at   timestamptz,
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now(),
    unique (user_id)
);

alter table public.profiles enable row level security;

create policy "Users can read own profile"
    on public.profiles for select
    using (auth.uid() = user_id);

create policy "Users can insert own profile"
    on public.profiles for insert
    with check (auth.uid() = user_id);

create policy "Users can update own profile"
    on public.profiles for update
    using (auth.uid() = user_id);

create policy "Users can delete own profile"
    on public.profiles for delete
    using (auth.uid() = user_id);

-- ─── Jobs ────────────────────────────────────────────────────────────────────
create table public.jobs (
    id                  uuid primary key default uuid_generate_v4(),
    title               text not null,
    company             text not null,
    location            text not null,
    source              text not null,     -- jobbird / nationale_vacaturebank / indeed_nl / linkedin_nl
    url                 text not null unique,
    description_snippet text,
    salary_range        text,
    contract_type       text,
    match_score         int,               -- 0–100, set per-user after AI scoring
    scraped_for_user    uuid references auth.users(id) on delete set null,
    scraped_at          timestamptz not null default now()
);

alter table public.jobs enable row level security;

create policy "Users can read jobs scraped for them"
    on public.jobs for select
    using (auth.uid() = scraped_for_user);

-- ─── Applications ────────────────────────────────────────────────────────────
create table public.applications (
    id          uuid primary key default uuid_generate_v4(),
    job_id      uuid not null references public.jobs(id) on delete cascade,
    user_id     uuid not null references auth.users(id) on delete cascade,
    company     text not null,
    job_title   text not null,
    letter_nl   text not null,
    send_method text not null,             -- email / form
    status      text not null default 'pending',  -- pending / sent / failed
    sent_at     timestamptz,
    created_at  timestamptz not null default now()
);

alter table public.applications enable row level security;

create policy "Users can read own applications"
    on public.applications for select
    using (auth.uid() = user_id);

create policy "Users can insert own applications"
    on public.applications for insert
    with check (auth.uid() = user_id);

-- ─── Storage bucket ───────────────────────────────────────────────────────────
-- Run manually in Supabase dashboard → Storage:
--   Bucket name: cvs
--   Private: yes (not public)
--   File size limit: 10 MB
--   Allowed MIME types: application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document

-- ─── Auto-updated timestamps ─────────────────────────────────────────────────
create or replace function update_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
    before update on public.profiles
    for each row execute procedure update_updated_at();
