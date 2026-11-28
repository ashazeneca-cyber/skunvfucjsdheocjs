# RAPSONYX — 3D Web Action Arena & Open-World Engine

**RAPSONYX** adalah game web 3D aksi arena 5v5 & open-world terintegrasi 11.11 km bertema *Luminous Frost Glassmorphism* dengan 42 hero dari 3 tim (Team Dream, Team Love, Team Passion), dibangun di atas arsitektur cloud penuh (Cloudflare Pages Edge Proxy + Hugging Face Docker Space Backend + Dual-Route Failover CDN).

## Arsitektur Cloud

- **Frontend (Static + Three.js + WebGL2/WebGPU)**: Dimuat langsung dari `index.html`, `css/`, `js/`, `data/`, dan `startup/` tanpa membutuhkan server dev lokal.
- **Anti-100K Cloudflare Proxy (`_routes.json` + `functions/cdn/[[path]].js`)**: Mengisolasi fungsi serverless hanya ke `/cdn/*` dan `/api/health`, dilengkapi proteksi redirect manual 5-hop (hanya mengirim header otorisasi ke host `*.huggingface.co` dan melepasnya pada redirect signed CDN XetHub/LFS) serta pemblokiran keras `403` untuk seluruh jalur terlarang.
- **Dual-Route Failover & Priority-0 Boot**: Saat intro hitam tampil, browser mengunduh 2 file kunci (`bg_loading_main` & `bgm_loading_main`) secara paralel ke Cache API + IndexedDB, lalu melanjutkan starter pack dengan dukungan failover otomatis ke backend Hugging Face Space (`/assets/*`).
- **Online Multiplayer & World Backend (`server/` & `server-java/`)**: Berjalan pada Hugging Face Space `https://ashazeneca-botanalistiktl.hf.space` menggunakan Colyseus/WebSocket (`ws`/`wss`), matchmaking room publik & private 6-karakter, bot backfill otomatis 8 detik, leaderboard global, dan sinkronisasi koordinat skill per-tick.

## Skrip Manajemen

Pastikan environment variable rahasia sudah disetel di shell sebelum menjalankan deployment (`CLOUDFLARE_API_TOKEN`, `RAPSONYX_SECRET`):

```bash
npm run audit
npm run verify
npm run deploy:hf
npm run deploy
```
