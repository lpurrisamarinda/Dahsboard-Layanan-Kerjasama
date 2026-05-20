/**
 * routes/auth.js
 * Endpoint autentikasi — login & info user.
 *
 * CATATAN PRODUKSI:
 * Implementasi ini menggunakan user hardcoded dari .env sebagai titik awal.
 * Untuk produksi multi-user, ganti dengan database (PostgreSQL/MongoDB)
 * dan simpan password sebagai hash bcrypt.
 */

const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// ─────────────────────────────────────────
// Daftar user (disederhanakan dari .env)
// Untuk multi-user: ganti dengan DB query
// ─────────────────────────────────────────
function getUsers() {
  return [
    {
      id: 1,
      username: process.env.ADMIN_USERNAME || 'admin',
      // Simpan password plain di env hanya untuk dev — hash di produksi
      password: process.env.ADMIN_PASSWORD || 'admin123',
      role: 'admin',
      nama: 'Administrator'
    },
    {
      id: 2,
      username: 'viewer',
      password: 'viewer123',
      role: 'viewer',
      nama: 'Viewer'
    }
  ];
}

/**
 * POST /api/auth/login
 * Body: { username, password }
 * Response: { token, user: { username, role, nama } }
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username dan password wajib diisi.' });
    }

    const users = getUsers();
    const user = users.find(u => u.username === username.toLowerCase().trim());

    if (!user) {
      return res.status(401).json({ error: 'Username atau password salah.' });
    }

    // Bandingkan password (plain untuk dev, bcrypt untuk produksi)
    const valid = password === user.password;
    if (!valid) {
      return res.status(401).json({ error: 'Username atau password salah.' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, nama: user.nama },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    res.json({
      token,
      user: { username: user.username, role: user.role, nama: user.nama }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
});

/**
 * GET /api/auth/me
 * Mengembalikan info user dari token yang aktif.
 */
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
