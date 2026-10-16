# Runbook Deploy Online — Arena Juara

Panduan praktis dari nol sampai siswa bisa bertanding dari HP masing-masing.
Pilih **satu** jalur: **A. Render + Neon** (disarankan) atau **B. Railway**.

> 🔐 **Jangan pernah mengirim connection string / password ke saya.** Kita uji
> dengan Anda menjalankan perintahnya sendiri dan mengirim **outputnya** saja.

---

## 0. Persiapan (sekali saja)

- [ ] Punya akun **GitHub**.
- [ ] Punya **Node.js** (sudah) dan **git** (sudah, v2.54).
- [ ] Proyek sudah di folder `arena-juara`.

### 0.1 Simpan ke Git & unggah ke GitHub

```powershell
cd "C:\Users\krnaw\Documents\Default Project\arena-juara"
git init
git add -A
git commit -m "Arena Juara: Duel TKA (Best of 5) - siap online"
```

Buat repo **kosong** di GitHub (misal `arena-juara`, jangan centang README), lalu:

```powershell
git branch -M main
git remote add origin https://github.com/<username>/arena-juara.git
git push -u origin main
```

Jika diminta login: gunakan **Personal Access Token** GitHub sebagai password
(GitHub → Settings → Developer settings → Tokens (classic) → scope `repo`).

---

## A. Render + Neon (disarankan)

### A.1 Buat database gratis di Neon

- [ ] Daftar di <https://neon.tech> → **New Project** (pilih region terdekat, mis. Singapore).
- [ ] Buka **Connection string** (format `postgresql://user:pass@.../db?sslmode=require`).
- [ ] **Salin** string itu — akan ditempel ke Render pada langkah A.3.

### A.2 Deploy aplikasi di Render

- [ ] Daftar di <https://render.com> dengan akun GitHub.
- [ ] **New +** → **Blueprint** → pilih repo `arena-juara` (Render membaca `render.yaml`)
      → **Apply**. (Alternatif: **New + → Web Service**, Runtime **Docker**, Health Check `/healthz`.)
- [ ] Tunggu build selesai (status **Live**).

### A.3 Isi `DATABASE_URL`

- [ ] Di layanan Render → tab **Environment** → **Add Environment Variable**:
      - Key: `DATABASE_URL`
      - Value: tempel connection string Neon (langkah A.1)
- [ ] **Save** (Render otomatis redeploy).

---

## B. Railway (alternatif, 1 layar)

- [ ] Daftar di <https://railway.app> dengan GitHub → **New Project → Deploy from GitHub repo** → pilih `arena-juara`.
- [ ] Di project yang sama: **New → Database → Add PostgreSQL**.
- [ ] Railway otomatis menyuntik `DATABASE_URL` ke service aplikasi (memakai `railway.json`).
- [ ] Buka **Settings → Networking → Generate Domain** untuk mendapat URL publik.

---

## 1. Verifikasi (wajib)

### 1.1 Cek server & penyimpanan

Ganti `<URL>` dengan alamat publik (mis. `https://arena-juara.onrender.com`).

```powershell
curl.exe https://<URL>/healthz
```

Harapan: `{"ok":true,"store":"postgres", ...}`
- Jika `"store":"json"` → `DATABASE_URL` belum terbaca (ulangi A.3 / cek B).
- Jika `"store":"postgres"` → database aktif. ✅

### 1.2 Uji tulis/baca PostgreSQL (dari komputer Anda)

```powershell
$env:DATABASE_URL="postgresql://...sslmode=require"
npm run test:pg
```

Harapan di akhir: **`HASIL: OK — PostgreSQL berfungsi (tulis & baca cocok).`**
(Kirimkan **output ini** ke saya bila ada kendala.)

### 1.3 Uji pertandingan sungguhan

- [ ] Buka `<URL>` di dua perangkat/dua browser.
- [ ] Isi profil (nama, kelas, sekolah, wilayah) di keduanya.
- [ ] Pilih **jenjang & mapel yang sama** → **Cari Lawan** di kedua perangkat.
- [ ] Pastikan keduanya masuk ke pertandingan yang sama (Best of 5).
- [ ] Setelah selesai, buka **🏆 Papan Peringkat → Nasional** dan pastikan nama muncul.
- [ ] Muat ulang halaman → data & rank tetap ada (bukti tersimpan di database).

---

## 2. Operasional

- **Menambah soal**: tombol **📝 Mode Guru**, atau impor ke `data/questions.json` lalu push (butuh redeploy).
- **Mengosongkan peringkat** (mode Postgres):
  ```sql
  TRUNCATE players, matches, questions;
  ```
- **URL kustom / batasi akses**: set `ALLOWED_ORIGIN=https://domainanda` (opsional).
- **Jangan naikkan ke banyak instance.** State pertandingan ada di memori. Untuk skala besar perlu Redis adapter + sticky session (bisa saya siapkan).

---

## 3. Jika gagal (troubleshooting)

| Gejala | Sebab umum | Solusi |
|---|---|---|
| Build gagal di Render | `package-lock.json` tidak ikut ter-commit | Pastikan lockfile ada di repo (`git add -A`) |
| `store":"json"` padahal sudah set | Env belum tersimpan / belum redeploy | Simpan ulang & tunggu redeploy |
| `test:pg` menolak koneksi | Perlu SSL / IP allowlist | Tambah `?sslmode=require`; pada Neon biasanya sudah aman |
| WebSocket gagal / pertandingan tak nyambung | Proxy tanpa upgrade WS | Platform ini sudah mendukung WS; jangan pakai CDN yang memblokir |
| Pertandingan lawan beda server | Lebih dari 1 instance | Set jumlah instance = **1** |
