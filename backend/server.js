/**
 * server.js
 * Entry point utama — Express server untuk PNBP Dashboard API.
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const jadwalRoutes = require('./routes/jadwal');
const rekananRoutes = require('./routes/rekanan');

const app = express();
const PORT = process.env.PORT || 3001;

// ──────────────────────────────────────────────
// Keamanan & Middleware Dasar
// ──────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false // Dinonaktifkan karena frontend di-serve dari folder statis
}));

app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL || 'http://localhost:3000'
    : '*',
  credentials: true
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting — cegah brute force
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 200,
  message: { error: 'Terlalu banyak permintaan. Coba lagi setelah 15 menit.' }
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Terlalu banyak percobaan login. Coba lagi setelah 15 menit.' }
});

app.use('/api/', limiter);
app.use('/api/auth/login', authLimiter);

// ──────────────────────────────────────────────
// API Routes
// ──────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/jadwal', jadwalRoutes);
app.use('/api/rekanan', rekananRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV
  });
});

// ──────────────────────────────────────────────
// Serve Frontend (Production)
// ──────────────────────────────────────────────
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/public')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/public/index.html'));
  });
}

// ──────────────────────────────────────────────
// Global Error Handler
// ──────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Terjadi kesalahan internal server.' });
});

// ──────────────────────────────────────────────
// Start Server
// ──────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n✅ PNBP Dashboard Server berjalan di http://localhost:${PORT}`);
  console.log(`📊 Environment : ${process.env.NODE_ENV || 'development'}`);
  console.log(`📋 Spreadsheet : ${process.env.SPREADSHEET_ID || '(belum dikonfigurasi)'}`);
  console.log(`\nEndpoint API tersedia:`);
  console.log(`  POST  /api/auth/login`);
  console.log(`  GET   /api/dashboard/summary`);
  console.log(`  GET|POST|PUT|DELETE  /api/jadwal`);
  console.log(`  GET|POST|PUT|DELETE  /api/rekanan/pnbp`);
  console.log(`  GET|POST|PUT|DELETE  /api/rekanan/non-pnbp\n`);
});

module.exports = app;
