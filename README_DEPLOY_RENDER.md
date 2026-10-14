# Cara memasang Netizen AI Studio di Render

Aplikasi web full-stack berbasis Node.js + Express. Aplikasi membaca teks, gambar dan hingga empat cuplikan gambar dari video. Video **tidak** dianalisis audionya. Foto, frame dan teks dikirim ke OpenAI hanya saat tombol Buat Komentar diklik.

## A. Unggah ke GitHub
1. Ekstrak ZIP yang berisi file ini.
2. Buka https://github.com/new. Buat repository **Private**, misalnya `netizen-ai-studio`.
3. Pada repo, pilih **Add file > Upload files**.
4. Unggah **isi folder hasil ekstraksi**, bukan file ZIP. Pastikan `package.json`, `server.js`, dan `render.yaml` tampak di root repository, sedangkan `index.html` berada dalam `public/`.
5. Pilih **Commit changes**. Jangan pernah unggah file `.env` berisi rahasia.

## B. Deploy manual lewat Web Service (direkomendasikan)
1. Buka https://dashboard.render.com. Masuk dengan GitHub lalu sambungkan repo.
2. Pilih **New > Web Service**, pilih repo Anda.
3. Name: `netizen-ai-studio` (boleh lain); Language: `Node`; Branch: `main`; Region: `Singapore`; Root Directory: kosong jika `package.json` di root.
4. Build Command: `npm install --omit=dev`; Start Command: `npm start`; Instance Type: `Free` untuk uji coba.
5. Di Environment masukkan:
   - `NODE_ENV` = `production`
   - `OPENAI_MODEL` = `gpt-4o-mini`
   - `OPENAI_API_KEY` = API key rahasia dari akun OpenAI Platform
   - `APP_ACCESS_TOKEN` = **kode akses aplikasi buatan Anda sendiri**, random dan minimal 12 karakter; disarankan 20 karakter ke atas.
6. Set HTTP Health Check Path ke `/health` jika tersedia, kemudian **Create Web Service**.
7. Tunggu sampai status `Live`. Buka URL https://nama-layanan-anda.onrender.com.

## C. Verifikasi
- Buka `/health`; harus berisi `{"status":"ok"}`.
- Pada halaman aplikasi, isi kolom `Kode akses aplikasi` dengan nilai `APP_ACCESS_TOKEN`, bukan OpenAI API key.
- Masukkan teks contoh dan buat 1 komentar/kategori.
- Coba unggah 1 gambar dan video pendek bila dibutuhkan.
- Jika 401: kode akses salah. Jika 503: env var token/kunci belum diatur. Jika 429: kuota/rate limit. Jika 502: periksa API key, billing, model, dan log Render.

## D. Alternatif Blueprint
Repo ini juga punya `render.yaml`. Di Render, pilih **New > Blueprint**, hubungkan repo, lalu isi kredensial yang diminta. Tidak perlu membuat Web Service kedua bila memakai Blueprint.

## E. Pengamanan dan biaya
- **Jangan taruh API key di HTML, JavaScript frontend, ZIP untuk publik, atau GitHub**. Simpan hanya di Render Environment.
- `APP_ACCESS_TOKEN` membatasi siapa yang boleh memakai endpoint berbayar. Jangan bagikan kode akses ke pengguna tak tepercaya.
- Render Free mengalami sleep setelah sekitar 15 menit idle. Untuk pemakaian penting gunakan plan berbayar.
- OpenAI API memerlukan kredit/billing terpisah dari ChatGPT Plus.
- Tidak ada database/riwayat permanen dalam paket ini.
- Jangan kirim materi sensitif/rahasia kecuali punya kewenangan dan persetujuan untuk pemrosesan pihak ketiga.

## F. Menjalankan lokal (opsional)
Di folder app: `npm install`; salin `.env.example` menjadi `.env` dan isi 2 rahasia; jalankan `npm start`; buka http://localhost:3000.

## Catatan
Aplikasi tidak membaca URL posting secara otomatis, dan tidak menganalisis audio video. Analisis foto/video memerlukan browser yang mendukung media yang diunggah. Periksa isi komentar sebelum dipublikasi; jangan gunakan untuk menciptakan kesan dukungan publik yang tidak autentik.
