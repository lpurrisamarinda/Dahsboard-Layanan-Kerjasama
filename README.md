# Dashboard Jadwal Siaran & Kemitraan PNBP

Web app manajemen jadwal siaran radio/TV dan kemitraan PNBP/Non-PNBP,
terintegrasi dengan Google Sheets sebagai database utama.

## Fitur
- Dashboard dengan metrik real-time & alert kontrak
- Kalender mingguan jadwal siaran
- Manajemen rekanan PNBP (berbayar) & Non-PNBP (barter)
- Two-way sync dengan Google Sheets
- Role-based access: Admin (CRUD) & Viewer (read-only)

## Quick Start
Lihat panduan lengkap di **[docs/SETUP.md](docs/SETUP.md)**

## Tech Stack
- **Backend**: Node.js + Express
- **Database**: Google Sheets (via Sheets API v4)
- **Frontend**: HTML5 + Vanilla JS (SPA)
- **Auth**: JWT

## API Endpoints
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | /api/auth/login | Login |
| GET | /api/dashboard/summary | Data dashboard |
| GET/POST | /api/jadwal | Daftar / tambah jadwal |
| PUT/DELETE | /api/jadwal/:id | Edit / hapus jadwal |
| GET/POST | /api/rekanan/pnbp | Rekanan PNBP |
| PUT/DELETE | /api/rekanan/pnbp/:id | Edit / hapus PNBP |
| GET/POST | /api/rekanan/non-pnbp | Rekanan Non-PNBP |
| PUT/DELETE | /api/rekanan/non-pnbp/:id | Edit / hapus Non-PNBP |
