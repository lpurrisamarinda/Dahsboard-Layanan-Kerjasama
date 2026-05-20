/**
 * routes/rekanan.js
 * CRUD endpoint untuk Rekanan PNBP dan Non-PNBP.
 */

const express = require('express');
const { rekananPNBP, rekananNonPNBP } = require('../googleSheets');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { validateRekananPNBP, validateRekananNonPNBP } = require('../middleware/validate');

const router = express.Router();

// ══════════════════════════════════════════════
// REKANAN PNBP
// ══════════════════════════════════════════════

// GET /api/rekanan/pnbp
router.get('/pnbp', requireAuth, async (req, res) => {
  try {
    let data = await rekananPNBP.getAll();
    const today = new Date();
    const in30 = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Filter berdasarkan ?status=aktif|akan_berakhir|expired
    if (req.query.status) {
      data = data.filter(r => {
        const exp = r.Tanggal_Berakhir ? new Date(r.Tanggal_Berakhir) : null;
        if (req.query.status === 'aktif') return exp && exp > in30;
        if (req.query.status === 'akan_berakhir') return exp && exp >= today && exp <= in30;
        if (req.query.status === 'expired') return exp && exp < today;
        return true;
      });
    }

    // Filter pencarian ?q=nama
    if (req.query.q) {
      const q = req.query.q.toLowerCase();
      data = data.filter(r =>
        r.Nama_Instansi?.toLowerCase().includes(q) ||
        r.PIC_Nama?.toLowerCase().includes(q)
      );
    }

    // Tambahkan field computed: status kontrak
    const today2 = new Date();
    data = data.map(r => {
      const exp = r.Tanggal_Berakhir ? new Date(r.Tanggal_Berakhir) : null;
      let status_kontrak = 'Aktif';
      if (exp) {
        if (exp < today2) status_kontrak = 'Expired';
        else if (exp <= new Date(today2.getTime() + 30 * 24 * 60 * 60 * 1000)) status_kontrak = 'Akan Berakhir';
      }
      return { ...r, status_kontrak };
    });

    res.json(data);
  } catch (err) {
    console.error('Get PNBP error:', err.message);
    res.status(500).json({ error: 'Gagal mengambil data rekanan PNBP.', detail: err.message });
  }
});

// POST /api/rekanan/pnbp
router.post('/pnbp', requireAuth, requireAdmin, validateRekananPNBP, async (req, res) => {
  try {
    const result = await rekananPNBP.create(req.body);
    res.status(201).json({ message: 'Rekanan PNBP berhasil ditambahkan.', data: result });
  } catch (err) {
    console.error('Create PNBP error:', err.message);
    res.status(500).json({ error: 'Gagal menambahkan rekanan.', detail: err.message });
  }
});

// PUT /api/rekanan/pnbp/:id
router.put('/pnbp/:id', requireAuth, requireAdmin, validateRekananPNBP, async (req, res) => {
  try {
    const result = await rekananPNBP.update(req.params.id, req.body);
    res.json({ message: 'Rekanan PNBP berhasil diperbarui.', data: result });
  } catch (err) {
    const status = err.message.includes('tidak ditemukan') ? 404 : 500;
    res.status(status).json({ error: err.message });
  }
});

// DELETE /api/rekanan/pnbp/:id
router.delete('/pnbp/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const result = await rekananPNBP.delete(req.params.id);
    res.json({ message: 'Rekanan PNBP berhasil dihapus.', data: result });
  } catch (err) {
    const status = err.message.includes('tidak ditemukan') ? 404 : 500;
    res.status(status).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════
// REKANAN NON-PNBP
// ══════════════════════════════════════════════

// GET /api/rekanan/non-pnbp
router.get('/non-pnbp', requireAuth, async (req, res) => {
  try {
    let data = await rekananNonPNBP.getAll();
    const today = new Date();
    const in30 = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

    if (req.query.status) {
      data = data.filter(r => {
        const exp = r.Tanggal_Berakhir ? new Date(r.Tanggal_Berakhir) : null;
        if (req.query.status === 'aktif') return exp && exp > in30;
        if (req.query.status === 'akan_berakhir') return exp && exp >= today && exp <= in30;
        if (req.query.status === 'expired') return exp && exp < today;
        return true;
      });
    }

    if (req.query.q) {
      const q = req.query.q.toLowerCase();
      data = data.filter(r =>
        r.Nama_Instansi?.toLowerCase().includes(q) ||
        r.PIC_Nama?.toLowerCase().includes(q)
      );
    }

    data = data.map(r => {
      const exp = r.Tanggal_Berakhir ? new Date(r.Tanggal_Berakhir) : null;
      let status_kontrak = 'Aktif';
      if (exp) {
        if (exp < today) status_kontrak = 'Expired';
        else if (exp <= in30) status_kontrak = 'Akan Berakhir';
      }
      return { ...r, status_kontrak };
    });

    res.json(data);
  } catch (err) {
    console.error('Get Non-PNBP error:', err.message);
    res.status(500).json({ error: 'Gagal mengambil data rekanan Non-PNBP.', detail: err.message });
  }
});

// POST /api/rekanan/non-pnbp
router.post('/non-pnbp', requireAuth, requireAdmin, validateRekananNonPNBP, async (req, res) => {
  try {
    const result = await rekananNonPNBP.create(req.body);
    res.status(201).json({ message: 'Rekanan Non-PNBP berhasil ditambahkan.', data: result });
  } catch (err) {
    res.status(500).json({ error: 'Gagal menambahkan rekanan.', detail: err.message });
  }
});

// PUT /api/rekanan/non-pnbp/:id
router.put('/non-pnbp/:id', requireAuth, requireAdmin, validateRekananNonPNBP, async (req, res) => {
  try {
    const result = await rekananNonPNBP.update(req.params.id, req.body);
    res.json({ message: 'Rekanan Non-PNBP berhasil diperbarui.', data: result });
  } catch (err) {
    const status = err.message.includes('tidak ditemukan') ? 404 : 500;
    res.status(status).json({ error: err.message });
  }
});

// DELETE /api/rekanan/non-pnbp/:id
router.delete('/non-pnbp/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const result = await rekananNonPNBP.delete(req.params.id);
    res.json({ message: 'Rekanan Non-PNBP berhasil dihapus.', data: result });
  } catch (err) {
    const status = err.message.includes('tidak ditemukan') ? 404 : 500;
    res.status(status).json({ error: err.message });
  }
});

module.exports = router;
