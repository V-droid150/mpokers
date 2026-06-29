-- Mpokers — Supabase schema
-- Run this in the Supabase Dashboard > SQL Editor for your project.

-- 1) Table holding one row per game room. The whole game state lives in `state`.
create table if not exists public.rooms (
  code        text primary key,
  state       jsonb not null,
  updated_at  timestamptz not null default now(),
  created_at  timestamptz not null default now()
);

-- 2) Row Level Security.
-- This is an account-free casual app: access is gated by the (hard-to-guess)
-- room code rather than auth. We allow anonymous read/insert/update so any
-- player who knows the code can play. No deletes are exposed.
alter table public.rooms enable row level security;

drop policy if exists "rooms_select" on public.rooms;
create policy "rooms_select" on public.rooms
  for select using (true);

drop policy if exists "rooms_insert" on public.rooms;
create policy "rooms_insert" on public.rooms
  for insert with check (true);

drop policy if exists "rooms_update" on public.rooms;
create policy "rooms_update" on public.rooms
  for update using (true) with check (true);

-- 3) Realtime: broadcast row changes to subscribed clients.
alter publication supabase_realtime add table public.rooms;

-- 4) (Optional) Housekeeping: a helper to purge stale rooms.
-- You can schedule this with pg_cron if desired.
--   delete from public.rooms where updated_at < now() - interval '24 hours';
