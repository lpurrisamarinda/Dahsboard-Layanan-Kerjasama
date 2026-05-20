/**
 * middleware/validate.js
 * Validasi input untuk setiap endpoint CRUD.
 * Mencegah data kotor masuk ke Google Sheets.
 */

// Format waktu HH:MM
function isValidTime(str) {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(str);
}

// Format tanggal YYYY-MM-DD
function isValidDate(str) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) return false;
  const d = new Date(str);
  return d instanceof Date && !isNaN(d);
}

// Nomor telepon Indonesia (10–15 digit)
function isValidPhone(str) {
  return /^[\d\s\-+]{10,15}$/.test(str);
}

/**
 * Validasi body untuk Jadwal Siaran
 */
function validateJadwal(req, res, next) {
  const { Hari, Jam_Mulai, Jam_Selesai, Nama_Program, Jenis_Siaran } = req.body;
  const errors = [];
  const hariValid = ['Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu'];

  if (!Hari || !hariValid.includes(Hari)) errors.push('Hari harus salah satu dari: Senin-Minggu.');
  if (!Jam_Mulai || !isValidTime(Jam_Mulai)) errors.push('Jam_Mulai harus format HH:MM (contoh: 07:00).');
  if (!Jam_Selesai || !isValidTime(Jam_Selesai)) errors.push('Jam_Selesai harus format HH:MM (contoh: 08:00).');
  if (Jam_Mulai && Jam_Selesai && Jam_Mulai >= Jam_Selesai) errors.push('Jam_Mulai harus lebih awal dari Jam_Selesai.');
  if (!Nama_Program || Nama_Program.trim().length < 2) errors.push('Nama_Program minimal 2 karakter.');
  if (!Jenis_Siaran || !['Rutin','Khusus'].includes(Jenis_Siaran)) errors.push('Jenis_Siaran harus: Rutin atau Khusus.');

  if (errors.length > 0) return res.status(400).json({ error: 'Validasi gagal.', detail: errors });
  next();
}

/**
 * Validasi body untuk Rekanan PNBP
 */
function validateRekananPNBP(req, res, next) {
  const {
    Nama_Instansi, PIC_Nama, PIC_Kontak, Nilai_Kontrak,
    Tanggal_Mulai, Tanggal_Berakhir, Status_Pembayaran, Status_Dokumen
  } = req.body;
  const errors = [];

  if (!Nama_Instansi || Nama_Instansi.trim().length < 2) errors.push('Nama_Instansi wajib diisi (min. 2 karakter).');
  if (!PIC_Nama || PIC_Nama.trim().length < 2) errors.push('PIC_Nama wajib diisi.');
  if (!PIC_Kontak || !isValidPhone(PIC_Kontak)) errors.push('PIC_Kontak harus berupa nomor telepon valid (10–15 digit).');
  if (Nilai_Kontrak === undefined || isNaN(parseFloat(Nilai_Kontrak)) || parseFloat(Nilai_Kontrak) < 0) {
    errors.push('Nilai_Kontrak harus berupa angka positif.');
  }
  if (!Tanggal_Mulai || !isValidDate(Tanggal_Mulai)) errors.push('Tanggal_Mulai harus format YYYY-MM-DD.');
  if (!Tanggal_Berakhir || !isValidDate(Tanggal_Berakhir)) errors.push('Tanggal_Berakhir harus format YYYY-MM-DD.');
  if (Tanggal_Mulai && Tanggal_Berakhir && Tanggal_Mulai >= Tanggal_Berakhir) {
    errors.push('Tanggal_Mulai harus lebih awal dari Tanggal_Berakhir.');
  }
  if (!['Lunas','Termin','Belum Bayar'].includes(Status_Pembayaran)) {
    errors.push('Status_Pembayaran harus: Lunas, Termin, atau Belum Bayar.');
  }
  if (!['MOU','PKS','Proses'].includes(Status_Dokumen)) {
    errors.push('Status_Dokumen harus: MOU, PKS, atau Proses.');
  }

  if (errors.length > 0) return res.status(400).json({ error: 'Validasi gagal.', detail: errors });
  next();
}

/**
 * Validasi body untuk Rekanan Non-PNBP
 */
function validateRekananNonPNBP(req, res, next) {
  const {
    Nama_Instansi, PIC_Nama, PIC_Kontak, Bentuk_Barter,
    Tanggal_Mulai, Tanggal_Berakhir, Status_Dokumen
  } = req.body;
  const errors = [];

  if (!Nama_Instansi || Nama_Instansi.trim().length < 2) errors.push('Nama_Instansi wajib diisi (min. 2 karakter).');
  if (!PIC_Nama || PIC_Nama.trim().length < 2) errors.push('PIC_Nama wajib diisi.');
  if (!PIC_Kontak || !isValidPhone(PIC_Kontak)) errors.push('PIC_Kontak harus berupa nomor telepon valid.');
  if (!Bentuk_Barter || Bentuk_Barter.trim().length < 5) errors.push('Bentuk_Barter wajib diisi (min. 5 karakter).');
  if (!Tanggal_Mulai || !isValidDate(Tanggal_Mulai)) errors.push('Tanggal_Mulai harus format YYYY-MM-DD.');
  if (!Tanggal_Berakhir || !isValidDate(Tanggal_Berakhir)) errors.push('Tanggal_Berakhir harus format YYYY-MM-DD.');
  if (!['MOU','PKS','Proses'].includes(Status_Dokumen)) {
    errors.push('Status_Dokumen harus: MOU, PKS, atau Proses.');
  }

  if (errors.length > 0) return res.status(400).json({ error: 'Validasi gagal.', detail: errors });
  next();
}

module.exports = { validateJadwal, validateRekananPNBP, validateRekananNonPNBP };
