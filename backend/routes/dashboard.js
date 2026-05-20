/**
 * routes/dashboard.js
 * Endpoint untuk data ringkasan dashboard utama.
 */

const express = require('express');
const { dashboard } = require('../googleSheets');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/dashboard/summary
 * Mengembalikan semua data agregat: metrik, alert, jadwal hari ini.
 */
router.get('/summary', requireAuth, async (req, res) => {
  try {
    const data = await dashboard.getSummary();
    res.json(data);
  } catch (err) {
    console.error('Dashboard error:', err.message);
    res.status(500).json({ error: 'Gagal mengambil data dashboard.', detail: err.message });
  }
});

module.exports = router;
