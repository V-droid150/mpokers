-- Mpokers — Supabase schema
-- Run this in the Supabase Dashboard > SQL Editor for your project.
-- Safe to re-run (idempotent).

-- 1) Table holding one row per game room. The whole game state lives in `state`.
create table if not exists public.rooms (
  code        text primary key,
  state       jsonb not null,
  updated_at  timestamptz not null default now(),
  created_at  timestamptz not null default now()
);

-- 2) Row Level Security.
-- The game is server-authoritative: all writes go through the Next.js API
-- routes (/api/room, /api/action) using the service-role key, which bypasses
-- RLS. Clients (anonymous-auth users) may only READ — reads are needed so
-- Realtime can broadcast state, and access is still gated by the room code.
alter table public.rooms enable row level security;

-- Read stays open (Realtime requires select; the room code is the access token).
drop policy if exists "rooms_select" on public.rooms;
create policy "rooms_select" on public.rooms
  for select using (true);

-- No anon insert/update/delete policies: with RLS enabled and no matching
-- policy, direct writes from the browser are denied. Only the service role
-- (server) can mutate rooms. Dropping any legacy open policies here:
drop policy if exists "rooms_insert" on public.rooms;
drop policy if exists "rooms_update" on public.rooms;

-- 3) Realtime: broadcast row changes to subscribed clients (guarded add).
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'rooms'
  ) then
    alter publication supabase_realtime add table public.rooms;
  end if;
end $$;

-- 4) (Optional) Housekeeping: purge stale rooms. Schedule with pg_cron if desired.
--   delete from public.rooms where updated_at < now() - interval '24 hours';
