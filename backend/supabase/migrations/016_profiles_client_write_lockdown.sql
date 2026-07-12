-- All profile writes go through the FastAPI backend (service role). No client
-- code writes public.profiles via PostgREST (verified: only a SELECT on the
-- homepage). Revoke client write access so server-managed columns
-- (job_search_summary, job_search_summary_approved_at, is_suspended,
-- abuse_report_count, credits_balance, referral_code, ...) cannot be set
-- directly with the anon key — previously the "update own profile" RLS policy
-- allowed any column to be written by the row owner.
revoke insert, update, delete on public.profiles from anon, authenticated;
