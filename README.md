# 🎰 Mpokers — Cardless Poker Chips

Aplikasi **poker tanpa kartu** untuk mengelola **chip & taruhan** secara online, real-time, dan mobile-friendly. Nuansa Vegas (dark + emas + felt hijau), hingga **8 pemain**, dengan pergerakan chip yang smooth saat bertaruh.

Pemain memakai kartu fisik / aturannya sendiri — aplikasi mengurus chip, blind, giliran taruhan (call / raise / fold / all-in), pot, dan pencatatan untung-rugi.

> Chip mewakili **nominal Rupiah**. Aplikasi ini hanya **mencatat** chip & taruhan — tidak memproses uang/transaksi apa pun.

## Fitur

- ⚡ **Real-time multiplayer** via Supabase Realtime — tiap pemain pakai HP sendiri, masuk lewat **kode meja** 4 huruf.
- 🃏 **Ronde betting otomatis**: dealer button berputar, small/big blind otomatis, giliran call/check/raise/fold/all-in, pot pindah ke pemenang yang dipilih host.
- 🪙 **Bet builder chip-by-chip**: ketuk chip (1rb–500rb) untuk menumpuk taruhan dengan animasi halus, atau pakai slider + tombol Min/Pot/All-in.
- 💰 **Chip = Rupiah** dengan top-up (re-buy) kapan saja antar-hand.
- 📱 **Mobile-first**, didesain seperti aplikasi (no zoom, tap target besar).
- 🎮 **Main Lokal (pass-and-play)** di `/local` — satu perangkat untuk semua pemain, tanpa perlu Supabase. Cocok untuk mencoba cepat.

## Stack

Next.js 14 (App Router) · TypeScript · Tailwind CSS · Framer Motion · Supabase (Realtime + Postgres).

Logika poker ada di modul murni `src/lib/engine.ts` (tanpa dependensi UI), diuji di `src/lib/engine.test.ts`.

## Menjalankan secara lokal

```bash
npm install
npm run dev          # http://localhost:3000
```

Tanpa konfigurasi Supabase, mode online akan menampilkan pesan setup, tapi **Main Lokal** (`/local`) tetap berfungsi penuh.

### Mengaktifkan mode online (Supabase)

1. Buat project baru di [supabase.com](https://supabase.com).
2. Di **SQL Editor**, jalankan isi `supabase/schema.sql` (membuat tabel `rooms`, RLS, dan mengaktifkan Realtime).
3. Salin kredensial:
   ```bash
   cp .env.local.example .env.local
   ```
   Isi dari **Project Settings → API**:
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```
4. `npm run dev`, lalu **Buat Meja Baru** dan bagikan kodenya ke pemain lain.

## Test & Build

```bash
npm test             # unit test engine poker (Node test runner)
npm run build        # production build
```

## Deploy (nanti)

Deploy ke Vercel: import repo, set Environment Variables `NEXT_PUBLIC_SUPABASE_URL` & `NEXT_PUBLIC_SUPABASE_ANON_KEY`, deploy. Auto-deploy tiap push ke `main`.

## Catatan desain

- **Tanpa side pot**: untuk all-in dengan stack berbeda, pot tunggal diberikan ke pemenang yang dipilih host (penyederhanaan home-game yang disengaja).
- **Tanpa akun**: identitas pemain tersimpan di `localStorage`; akses meja diamankan oleh kode meja yang sulit ditebak.

---

Built by **Red Lens**.
