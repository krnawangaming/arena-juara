# Arena Juara — Duel TKA (Best of 5)

Game **PvP real-time** untuk semua jenjang (SD–SMK) dan lintas mapel, berbasis
**kisi-kisi TKA** dan **Perka BSKAP No. 047/H/AN/2025** (SD/MI & SMP/MTs) serta
**Perka No. 045/H/AN/2025** (SMA/MA/SMK/MAK).

Dua siswa di perangkat berbeda bertanding **1 lawan 1**:
- **Best of 5** — menang 3 ronde jadi juara.
- Tiap ronde menampilkan **soal yang sama** ke kedua pemain, waktu **maks 120 detik**.
- Pemenang ronde = **jawaban benar & tercepat**. Kalau seri → **ronde tambahan (adu cepat)**.
- **Menang naik bintang, kalah turun bintang** (mirip MLBB), dengan **perlindungan rank**.
- **Makin tinggi rank, makin sulit soal** (kesulitan 1–5) dan **matchmaking se-rank**.

---

## 1. Cara menjalankan (lokal)

Butuh **Node.js 18+** (diuji di Node 22).

```powershell
cd "C:\Users\krnaw\Documents\Default Project\arena-juara"
npm install
npm start
```

Lalu buka di browser:
- Komputer sendiri: **http://localhost:3000**
- HP siswa (satu jaringan Wi‑Fi): **http://<IP-komputer>:3000** — IP ditampilkan saat server start, mis. `http://172.16.128.121:3000`.

> Agar HP bisa membuka, komputer & HP harus di Wi‑Fi yang sama, dan Windows
> Firewall perlu mengizinkan Node.js (pilih **Allow** saat muncul dialog).

### Pengaturan cepat (opsional, untuk uji/demo)
Ubah durasi lewat environment variable, misal 20 detik/soal:

```powershell
$env:AJ_Q_SECONDS=20; npm start
```

| Variabel | Bawaan | Arti |
|---|---|---|
| `AJ_Q_SECONDS` | 120 | Batas waktu per soal (detik) |
| `AJ_ROUNDS_TO_WIN` | 3 | Ronde untuk menang |
| `AJ_COUNTDOWN_MS` | 3000 | Hitung mundur sebelum ronde 1 |
| `AJ_RESULT_MS` | 5000 | Jeda tampil hasil ronde |
| `PORT` | 3000 | Port server |

---

## 2. Struktur proyek

```
arena-juara/
├─ server.js                 # Express + Socket.IO, REST API, papan peringkat
├─ src/
│  ├─ config.js              # konstanta & env
│  ├─ game.js                # mesin pertandingan (matchmaking, ronde, penilaian)
│  ├─ ranks.js               # sistem rank (tier/divisi/bintang + perlindungan)
│  ├─ questions.js           # bank soal: pilih, sanitasi, cek jawaban
│  ├─ regions.js             # data wilayah (cascade)
│  ├─ store.js               # facade penyimpanan (memori + tulis ke backend)
│  └─ storage/
│     ├─ json.js             # backend berkas JSON (lokal / volume)
│     └─ postgres.js         # backend PostgreSQL (online tahan lama)
├─ public/                   # antarmuka (HTML/CSS/JS, mobile-first)
├─ data/
│  ├─ questions.json         # BANK SOAL seed (413 butir)
│  └─ wilayah/               # provinsi/kab/kec/kelurahan (JSON)
├─ tools/
│  ├─ build-wilayah.js       # CSV wilayah -> JSON
│  ├─ generate-questions.js  # generator butir numerik
│  ├─ test-match.js          # uji otomatis 2 klien 1 pertandingan
│  └─ opponent.js            # lawan headless (uji UI)
├─ Dockerfile · docker-compose.yml        # jalankan app + PostgreSQL
├─ render.yaml · railway.json · Procfile  # konfigurasi hosting
├─ fly.toml · .env.example                # Fly.io & contoh variabel
└─ data/db.json              # dibuat otomatis (data pemain & soal guru)
```

---

## 3. Bentuk soal (sesuai TKA)

1. **Pilihan Ganda** — satu jawaban benar.
2. **PG Kompleks – MCMA** — jawaban benar lebih dari satu (semua harus benar).
3. **PG Kompleks – Kategori** — menilai tiap pernyataan **Benar/Salah** (atau Sesuai/Tidak Sesuai).

Setiap butir punya `difficulty` 1–5; soal disajikan sesuai rank pemain.

---

## 4. Bank soal

- Bawaan: **413 butir** (lihat `npm start` → log, atau `GET /api/bank/ringkasan`).
  Sudah ~50+ butir untuk Matematika (SD/SMP/SMA), IPAS (SD), IPA (SMP), dan Fisika (SMA).
- **Tambah lewat aplikasi (Mode Guru):** tombol **📝 Mode Guru** di lobi.
  Untuk PG/MCMA, tandai jawaban benar dengan tanda `*` di depan baris. Soal tersimpan ke
  penyimpanan aktif (`data/db.json` saat lokal, atau database saat online) dan otomatis
  dimuat ulang setiap server dijalankan.
- **Tambah banyak lewat generator:**
  ```powershell
  npm run generate      # menambah butir numerik (target 50/kombinasi)
  ```
- **Impor massal:** `data/questions.json` berformat array JSON; tambahkan butir dengan
  struktur seperti contoh berikut:

```json
{ "id":"sma-mtk-99", "jenjang":"SMA", "mapel":"Matematika", "difficulty":4,
  "type":"pg", "question":"…", "options":["A","B","C","D"], "answer":1, "pembahasan":"…" }
```

> Untuk mencukupi **~50 soal/kombo teks** (B. Indonesia, B. Inggris, IPS, dst.),
> gunakan Mode Guru / impor sesuai kisi-kisi TKA. Beri tahu saya mapel & jenjang mana
> yang ingin dilengkapi lebih dulu.

---

## 5. Sistem rank

Tier (naik ke atas semakin sulit): **Perunggu → Perak → Emas → Platinum → Berlian →
Master → Grandmaster → Mythic** (tiap tier punya beberapa divisi + bintang).

- **Menang** = +1 bintang (bisa promosi divisi/tier).
- **Kalah** = −1 bintang.
- **Perlindungan rank:**
  - Lantai mutlak di **Perunggu III**.
  - **Perunggu & Perak** tidak bisa turun tier.
  - **Kartu perlindungan** (🛡) diperoleh saat naik tier dan menyerap 1 kekalahan.
- Saat menang WO (lawan keluar) tetap dihitung menang.

Papan peringkat berjenjang: **Kelas → Sekolah → Kelurahan → Kecamatan →
Kabupaten/Kota → Provinsi → Nasional** (menu 🏆).

---

## 6. REST API ringkas

| Metode | Jalur | Fungsi |
|---|---|---|
| GET | `/api/wilayah/provinsi` · `/kabupaten?prov=` · `/kecamatan?kab=` · `/kelurahan?kec=` | data wilayah |
| GET | `/api/bank/ringkasan` · `/api/bank/mapel?jenjang=` | info bank soal |
| POST | `/api/guru/soal` | tambah soal (mode guru) |
| GET | `/api/papan?scope=&jenjang=&limit=` | papan peringkat |
| GET | `/api/pertandingan/terbaru` | riwayat pertandingan |
| GET | `/api/health` | status server |

Scope papan: `kelas`, `sekolah`, `kelurahan`, `kecamatan`, `kota`, `provinsi`, `nasional`.

---

## 7. Pengujian

```powershell
npm start                 # di terminal 1
npm run test:match        # di terminal 2 (uji 2 klien, 1 pertandingan penuh)
```

Uji cepat (ronde singkat):
```powershell
$env:AJ_Q_SECONDS=4; $env:AJ_COUNTDOWN_MS=500; $env:AJ_RESULT_MS=400; npm start
```

---

## 8. Versi online (2 perangkat jarak jauh)

Aplikasi ini **satu proses** (Express + Socket.IO), jadi bisa langsung di-deploy.
Prinsip pentingnya:

- **Jalankan 1 instance saja** (state pertandingan ada di memori). Jangan aktifkan auto-scale
  ke banyak instance, kecuali nanti ditambah *Redis adapter* + *sticky session*.
- **Penyimpanan** — pilih salah satu:
  - **Postgres** (disarankan untuk online): isi variabel **`DATABASE_URL`**.
    Aplikasi otomatis memakai backend PostgreSQL.
  - **Berkas JSON + volume tetap**: arahkan **`DATA_DIR`** ke folder volume (mis. `/data`).
- HTTPS/domain diberikan otomatis oleh platform. Health check tersedia di **`/healthz`**.

### Variabel lingkungan

| Variabel | Wajib | Arti |
|---|---|---|
| `PORT` | tidak | Port (biasanya diisi otomatis platform) |
| `DATABASE_URL` | dianjurkan | Koneksi Postgres, mis. `postgres://user:pass@host:5432/db` |
| `DATA_DIR` | tidak | Folder data backend berkas (mis. `/data` pada volume) |
| `ALLOWED_ORIGIN` | tidak | Batasi asal koneksi (mis. `https://arena-juara.onrender.com`) |
| `AJ_Q_SECONDS` | tidak | Batas waktu/soal (detik, bawaan 120) |

### Cara A — Render (gratis, disarankan)

1. Unggah proyek ke GitHub.
2. Di [render.com](https://render.com): **New + → Blueprint**, pilih repo ini
   (Render membaca `render.yaml`), atau **New + → Web Service** dengan:
   - Runtime **Docker** (otomatis memakai `Dockerfile`), atau Runtime **Node** dengan
     Build `npm install` dan Start `npm start`.
3. Siapkan database gratis: buat Postgres di [neon.tech](https://neon.tech) (atau Supabase),
   salin *connection string*, lalu tempel ke Environment Variable **`DATABASE_URL`** di Render.
4. Deploy. Buka URL `https://<nama>.onrender.com` di HP siswa.

> Tanpa `DATABASE_URL`, Render tetap jalan memakai berkas JSON, tetapi **data bisa hilang
> saat redeploy/restart** (disk gratis bersifat sementara).

### Cara B — Railway

1. [railway.app](https://railway.app) → **New Project → Deploy from GitHub repo**.
2. Tambahkan **New → Database → PostgreSQL** (Railway menyuntik `DATABASE_URL` otomatis).
3. Railway memakai `railway.json` (`npm start`, health check `/healthz`).

### Cara C — Fly.io (berkas JSON + volume)

```bash
fly launch --no-deploy
fly volumes create arena_data -s 1
fly deploy
```
`fly.toml` sudah menyetel `DATA_DIR=/data` dan memasang volume `arena_data`.

### Cara D — VPS / Docker (app + PostgreSQL)

```bash
docker compose up --build      # menjalankan app + Postgres sekaligus
```
Atau di server sendiri: `npm install --omit=dev` lalu `DATA_DIR=/data DATABASE_URL=... npm start`
di balik reverse proxy (Nginx/Caddy) yang meneruskan WebSocket.

### Menambah kapasitas (opsional, lanjutan)

Untuk banyak instance/ sekolah serentak: tambahkan `@socket.io/redis-adapter`, aktifkan
sticky session, dan pindahkan state pertandingan ke Redis. Beri tahu saya bila ingin
saya siapkan.

---

## 9. Catatan & batasan

- **Data wilayah:** 34 provinsi, 514 kab/kota, 7.215 kecamatan, 80.534 kelurahan/desa
  (sumber: edwardsamuel/Wilayah-Administratif-Indonesia). Belum termasuk 4 provinsi
  Papua hasil pemekaran 2022. Untuk memperbarui, ganti CSV di `data/wilayah-csv/`
  lalu jalankan `npm run wilayah`.
- **Tanpa login.** Identitas disimpan di `localStorage` perangkat (kunci `aj_pid`).
  Jika siswa berganti perangkat, rank-nya tidak berpindah otomatis.
- **Penyimpanan:** default berkas JSON di `data/db.json` (lokal/volume). Bila
  `DATABASE_URL` diisi, data memakai PostgreSQL. Menghapus data berarti menghapus
  `data/db.json` (mode berkas) atau menjalankan `TRUNCATE players, matches, questions`
  (mode Postgres).
- **Satu instance.** State pertandingan disimpan di memori proses; menjalankan
  beberapa instance sekaligus tanpa Redis adapter akan memecah matchmaking/pertandingan.
- Bank soal teks (B. Indonesia, B. Inggris, IPS, SMK kejuruan) baru berisi contoh;
  silakan tambah lewat Mode Guru/impor agar tiap kombinasi mencapai ±50 butir.
