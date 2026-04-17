-- Migration 002: add contact email to jobs, user email to profiles
-- Run after 001_initial_schema.sql

alter table public.jobs
    add column if not exists contact_email text;

-- Store the user's email on their profile (mirrored from auth.users for easy access)
alter table public.profiles
    add column if not exists email text;
