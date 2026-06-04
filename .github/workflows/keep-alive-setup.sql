-- Run this in the Supabase SQL Editor (supabase.com → your project → SQL Editor)

-- 1. Create the keep_alive table
create table if not exists public.keep_alive (
  id   int generated always as identity primary key,
  ts   timestamptz not null default now()
);

-- 2. Seed one row so the SELECT always returns something
insert into public.keep_alive default values;

-- 3. Enable RLS
alter table public.keep_alive enable row level security;

-- 4. Allow the anon key to read (SELECT only)
create policy "anon can read keep_alive"
  on public.keep_alive
  for select
  to anon
  using (true);
