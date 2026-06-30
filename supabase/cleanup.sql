-- Mpokers — auto-purge meja (rooms) yang sudah lama tidak aktif.
-- Jalankan SEKALI di Supabase Dashboard > SQL Editor.
--
-- Prasyarat: aktifkan extension pg_cron lewat
--   Dashboard > Database > Extensions > cari "pg_cron" > Enable
-- (atau biarkan baris `create extension` di bawah yang mengaktifkannya).

create extension if not exists pg_cron;

-- Hapus jadwal lama dengan nama sama (kalau ada), supaya idempotent.
select cron.unschedule('mpokers-purge-stale-rooms')
where exists (
  select 1 from cron.job where jobname = 'mpokers-purge-stale-rooms'
);

-- Setiap hari jam 04:00 UTC (±11:00 WIB), hapus meja yang tidak ada update
-- selama 24 jam terakhir. Cron berjalan sebagai owner sehingga RLS tidak menghalangi.
select cron.schedule(
  'mpokers-purge-stale-rooms',
  '0 4 * * *',
  $$ delete from public.rooms where updated_at < now() - interval '24 hours' $$
);

-- Cek jadwal yang aktif:
--   select jobname, schedule, command from cron.job;
-- Hapus jadwal manual kalau perlu:
--   select cron.unschedule('mpokers-purge-stale-rooms');
