/**
 * routes/jadwal.js
 * CRUD endpoint untuk Jadwal Siaran.
 * Semua operasi tulis (POST/PUT/DELETE) hanya untuk Admin.
 */

const express = require('express');
const { jadwal } = require('../googleSheets');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { validateJadwal } = require('../middleware/validate');

const router = express.Router();

// GET /api/jadwal — ambil semua jadwal
router.get('/', requireAuth, async (req, res) => {
  try {
    const data = await jadwal.getAll();
    // Filter opsional berdasarkan query ?hari=Senin
    if (req.query.hari) {
      return res.json(data.filter(j => j.Hari === req.query.hari));
    }
    res.json(data);
  } catch (err) {
    console.error('Get jadwal error:', err.message);
    res.status(500).json({ error: 'Gagal mengambil data jadwal.', detail: err.message });
  }
});

// POST /api/jadwal — tambah jadwal baru (admin only)
router.post('/', requireAuth, requireAdmin, validateJadwal, async (req, res) => {
  try {
    const result = await jadwal.create(req.body);
    res.status(201).json({ message: 'Jadwal berhasil ditambahkan.', data: result });
  } catch (err) {
    console.error('Create jadwal error:', err.message);
    res.status(500).json({ error: 'Gagal menambahkan jadwal.', detail: err.message });
  }
});

// PUT /api/jadwal/:id — update jadwal (admin only)
router.put('/:id', requireAuth, requireAdmin, validateJadwal, async (req, res) => {
  try {
    const result = await jadwal.update(req.params.id, req.body);
    res.json({ message: 'Jadwal berhasil diperbarui.', data: result });
  } catch (err) {
    console.error('Update jadwal error:', err.message);
    const status = err.message.includes('tidak ditemukan') ? 404 : 500;
    res.status(status).json({ error: err.message });
  }
});

// DELETE /api/jadwal/:id — hapus jadwal (admin only)
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const result = await jadwal.delete(req.params.id);
    res.json({ message: 'Jadwal berhasil dihapus.', data: result });
  } catch (err) {
    console.error('Delete jadwal error:', err.message);
    const status = err.message.includes('tidak ditemukan') ? 404 : 500;
    res.status(status).json({ error: err.message });
  }
});

module.exports = router;
