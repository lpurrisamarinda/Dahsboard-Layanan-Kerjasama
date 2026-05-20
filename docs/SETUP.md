# PANDUAN SETUP LENGKAP
# Dashboard Jadwal Siaran & Kemitraan PNBP
# ============================================================

## RINGKASAN LANGKAH

1. Persiapan Google Cloud (Service Account + Spreadsheet)
2. Install Node.js & dependencies
3. Konfigurasi file .env
4. Jalankan server
5. Akses web app

---

## LANGKAH 1 — PERSIAPAN GOOGLE CLOUD

### 1A. Buat Google Cloud Project

1. Buka https://console.cloud.google.com
2. Klik menu dropdown project di pojok kiri atas
3. Klik "New Project"
4. Nama project: `pnbp-dashboard` (bebas)
5. Klik "Create"

### 1B. Aktifkan Google Sheets API

1. Di Google Cloud Console, buka menu navigasi → "APIs & Services" → "Library"
2. Cari "Google Sheets API"
3. Klik hasilnya → klik tombol "Enable"

### 1C. Buat Service Account

1. Buka "APIs & Services" → "Credentials"
2. Klik "+ Create Credentials" → pilih "Service Account"
3. Isi:
   - Service account name: `pnbp-sheets-bot`
   - Service account ID: (otomatis terisi)
   - Description: "Bot akses Google Sheets untuk PNBP Dashboard"
4. Klik "Create and Continue"
5. Role: pilih "Editor" (atau "Basic > Editor")
6. Klik "Continue" → "Done"

### 1D. Download JSON Key

1. Di halaman Credentials, klik service account yang baru dibuat
2. Buka tab "Keys"
3. Klik "Add Key" → "Create new key"
4. Pilih format: JSON
5. Klik "Create" — file JSON otomatis terunduh
6. **RENAME** file tersebut menjadi: `service-account.json`
7. **PINDAHKAN** ke folder: `pnbp-dashboard/backend/`

   Struktur folder yang benar:
   ```
   backend/
   ├── service-account.json   ← letakkan di sini
   ├── server.js
   ├── .env
   └── ...
   ```

### 1E. Buat Google Spreadsheet

1. Buka https://sheets.google.com → buat spreadsheet baru
2. Rename spreadsheet: "PNBP Dashboard Database"
3. **Buat 3 tab** (klik + di bawah, rename):
   - Tab 1: `Jadwal_Siaran`
   - Tab 2: `Rekanan_PNBP`
   - Tab 3: `Rekanan_Non_PNBP`

4. **Isi baris header** di masing-masing tab (baris 1):

   Tab `Jadwal_Siaran` (kolom A–H):
   ```
   ID_Jadwal | Hari | Jam_Mulai | Jam_Selesai | Nama_Program | Jenis_Siaran | ID_Rekanan | Keterangan
   ```

   Tab `Rekanan_PNBP` (kolom A–J):
   ```
   ID_Rekanan | Nama_Instansi | PIC_Nama | PIC_Kontak | Nilai_Kontrak | Nomor_Kontrak | Tanggal_Mulai | Tanggal_Berakhir | Status_Pembayaran | Status_Dokumen
   ```

   Tab `Rekanan_Non_PNBP` (kolom A–H):
   ```
   ID_Rekanan | Nama_Instansi | PIC_Nama | PIC_Kontak | Bentuk_Barter | Tanggal_Mulai | Tanggal_Berakhir | Status_Dokumen
   ```

5. **Share spreadsheet ke service account:**
   - Klik tombol "Share" (pojok kanan atas)
   - Masukkan email service account (lihat di file JSON, field `client_email`)
     Contoh: `pnbp-sheets-bot@pnbp-dashboard.iam.gserviceaccount.com`
   - Ubah role ke "Editor"
   - **Hapus centang** "Notify people"
   - Klik "Share"

6. **Salin Spreadsheet ID** dari URL:
   ```
   https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID_DI_SINI]/edit
   ```
   Contoh: `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms`

---

## LANGKAH 2 — INSTALL NODE.JS

Jika Node.js belum terinstall:

**Windows:**
1. Download installer dari https://nodejs.org (pilih versi LTS)
2. Jalankan installer, ikuti wizard
3. Buka Command Prompt baru setelah selesai

**Linux/Mac:**
```bash
# Menggunakan nvm (direkomendasikan)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install --lts
nvm use --lts
```

Verifikasi:
```bash
node --version   # Harus v18+ 
npm --version
```

---

## LANGKAH 3 — INSTALL DEPENDENCIES

Buka terminal/Command Prompt, masuk ke folder backend:

```bash
cd pnbp-dashboard/backend
npm install
```

Tunggu hingga selesai (membutuhkan koneksi internet).

---

## LANGKAH 4 — KONFIGURASI FILE .env

1. Di folder `backend/`, salin file template:
   ```bash
   # Linux/Mac:
   cp .env.example .env

   # Windows:
   copy .env.example .env
   ```

2. Buka file `.env` dengan text editor (Notepad, VS Code, dll.)

3. Isi nilai-nilainya:
   ```env
   PORT=3001
   NODE_ENV=development

   # Ganti dengan string acak panjang — bisa generate di:
   # https://www.allkeysgenerator.com/Random/Security-Encryption-Key-Generator.aspx
   JWT_SECRET=isi_string_rahasia_panjang_minimal_32_karakter_di_sini

   JWT_EXPIRES_IN=8h

   # Path ke file service account (relatif dari folder backend/)
   GOOGLE_SERVICE_ACCOUNT_PATH=./service-account.json

   # Tempel Spreadsheet ID yang disalin dari URL tadi
   SPREADSHEET_ID=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms

   # Nama tab di spreadsheet (jangan diubah kecuali nama tabnya berbeda)
   SHEET_JADWAL=Jadwal_Siaran
   SHEET_PNBP=Rekanan_PNBP
   SHEET_NONPNBP=Rekanan_Non_PNBP

   # Password admin (ganti sebelum production!)
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=GantiPasswordIni123!
   ```

4. Simpan file `.env`

---

## LANGKAH 5 — JALANKAN SERVER

```bash
# Dari folder backend/
npm start
```

Output yang benar:
```
✅ PNBP Dashboard Server berjalan di http://localhost:3001
📊 Environment : development
📋 Spreadsheet : 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms
```

Untuk development (auto-restart saat file berubah):
```bash
npm run dev
```

---

## LANGKAH 6 — AKSES WEB APP

1. Buka file `frontend/public/index.html` langsung di browser
   **ATAU** gunakan extension "Live Server" di VS Code

2. Login dengan:
   - Admin: `admin` / password dari .env
   - Viewer: `viewer` / `viewer123`

3. Pastikan server backend sudah berjalan di background

---

## TROUBLESHOOTING

### Error: "GOOGLE_APPLICATION_CREDENTIALS" atau "service-account.json not found"
→ Pastikan file `service-account.json` ada di folder `backend/`
→ Cek path di `.env`: `GOOGLE_SERVICE_ACCOUNT_PATH=./service-account.json`

### Error: "The caller does not have permission"
→ Spreadsheet belum di-share ke email service account
→ Buka spreadsheet → Share → tambahkan email `client_email` dari JSON key

### Error: "Requested entity was not found" (sheet not found)
→ Nama tab di spreadsheet tidak cocok dengan di `.env`
→ Pastikan nama tab persis sama (case-sensitive): `Jadwal_Siaran`, `Rekanan_PNBP`, `Rekanan_Non_PNBP`

### Error: "Cannot connect to server" di frontend
→ Backend belum berjalan — jalankan `npm start` di folder backend
→ Cek nilai `const API = 'http://localhost:3001/api'` di index.html

### CORS Error di browser
→ Buka browser dengan `--disable-web-security` untuk testing lokal
→ Atau gunakan Live Server (port 5500) dan tambahkan ke CORS di server.js

---

## DEPLOYMENT KE SERVER (PRODUCTION)

### Menggunakan PM2 (Process Manager):

```bash
# Install PM2 global
npm install -g pm2

# Dari folder backend/
NODE_ENV=production pm2 start server.js --name "pnbp-dashboard"

# Auto-start saat reboot
pm2 startup
pm2 save
```

### Menggunakan Nginx sebagai reverse proxy:

```nginx
server {
    listen 80;
    server_name dashboard.domainanda.com;

    # Frontend
    root /var/www/pnbp-dashboard/frontend/public;
    index index.html;

    # API Backend
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### Environment variable untuk production:
```env
NODE_ENV=production
FRONTEND_URL=https://dashboard.domainanda.com
JWT_EXPIRES_IN=4h
```

---

## STRUKTUR FILE LENGKAP

```
pnbp-dashboard/
├── backend/
│   ├── middleware/
│   │   ├── auth.js          ← Verifikasi JWT
│   │   └── validate.js      ← Validasi input form
│   ├── routes/
│   │   ├── auth.js          ← POST /api/auth/login
│   │   ├── dashboard.js     ← GET /api/dashboard/summary
│   │   ├── jadwal.js        ← CRUD /api/jadwal
│   │   └── rekanan.js       ← CRUD /api/rekanan/pnbp & non-pnbp
│   ├── googleSheets.js      ← Layer integrasi Google Sheets API
│   ├── server.js            ← Entry point Express
│   ├── package.json
│   ├── .env                 ← Konfigurasi (JANGAN di-commit ke Git)
│   ├── .env.example         ← Template konfigurasi
│   └── service-account.json ← Key Google Cloud (JANGAN di-commit ke Git)
│
├── frontend/
│   └── public/
│       └── index.html       ← Seluruh UI (SPA)
│
└── docs/
    └── SETUP.md             ← File ini
```

---

## KEAMANAN — PENTING!

Tambahkan ke file `.gitignore` sebelum push ke Git:
```
backend/.env
backend/service-account.json
backend/node_modules/
```

Jangan pernah share atau upload file `.env` dan `service-account.json` ke repositori publik.
