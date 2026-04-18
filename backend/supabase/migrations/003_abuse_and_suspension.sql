-- Migration 003: abuse reporting + user suspension
-- Run after 002_add_contact_fields.sql

-- ── New columns on profiles ───────────────────────────────────────────────────
alter table public.profiles
    add column if not exists is_suspended       boolean not null default false,
    add column if not exists abuse_report_count int     not null default 0;

-- ── Abuse reports table ───────────────────────────────────────────────────────
create table if not exists public.abuse_reports (
    id               uuid primary key default uuid_generate_v4(),
    reporter_email   text not null,
    reporter_company text not null,
    sender_email     text not null,
    description      text not null,
    reporter_ip      text,
    status           text not null default 'pending_review',
    admin_notes      text,
    created_at       timestamptz not null default now(),
    resolved_at      timestamptz
);

alter table public.abuse_reports enable row level security;

-- Only the service role (backend) can read/write abuse reports — no user access
-- No policies needed: RLS enabled + no policies = all client access denied
