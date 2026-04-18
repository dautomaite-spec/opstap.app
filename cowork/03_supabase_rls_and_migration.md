# Cowork prompt — Run migration 003 + verify RLS in Supabase

Copy everything below the line into Cowork.

---

You are helping me run a database migration and verify Row Level Security (RLS) on a Supabase project. Follow these steps exactly.

## Step 1 — Open the SQL editor
Go to: https://supabase.com/dashboard/project/rwwumtwelwncdqmvhdkt/sql/new

## Step 2 — Run migration 003
Paste the following SQL and click "Run":

```sql
-- Migration 003: abuse reporting + user suspension

alter table public.profiles
    add column if not exists is_suspended       boolean not null default false,
    add column if not exists abuse_report_count int     not null default 0;

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
```

Tell me if it ran without errors.

## Step 3 — Verify RLS is enabled on all tables
Go to: https://supabase.com/dashboard/project/rwwumtwelwncdqmvhdkt/editor

Run this query:
```sql
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
order by tablename;
```

All tables should show `rowsecurity = true`. Tell me what the output is.

## Step 4 — Verify RLS policies exist
Run this query:
```sql
select tablename, policyname, cmd, qual
from pg_policies
where schemaname = 'public'
order by tablename, policyname;
```

Tell me the full output.

## Step 5 — Verify the cvs storage bucket exists and is private
Go to: https://supabase.com/dashboard/project/rwwumtwelwncdqmvhdkt/storage/buckets

Check:
- Is there a bucket called `cvs`?
- Is it set to **Private** (not public)?

If the bucket does not exist, create it:
- Name: `cvs`
- Public: NO (keep it private)
- File size limit: 10 MB
- Allowed MIME types: `application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document`

Tell me whether the bucket existed or if you had to create it.
