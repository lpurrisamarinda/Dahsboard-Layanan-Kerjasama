/**
 * googleSheets.js
 * Layer integrasi Google Sheets API menggunakan Service Account.
 * Semua operasi CRUD ke spreadsheet dilakukan melalui modul ini.
 */

const { google } = require('googleapis');
const path = require('path');

// ──────────────────────────────────────────────
// Inisialisasi Auth
// ──────────────────────────────────────────────
function getAuth() {
  // Mendukung dua mode:
  // 1. Railway/production: GOOGLE_SERVICE_ACCOUNT_JSON berisi isi JSON langsung (env var)
  // 2. Lokal/development: GOOGLE_SERVICE_ACCOUNT_PATH menunjuk ke file .json
  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
    return new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
  }
  const keyFilePath = path.resolve(process.env.GOOGLE_SERVICE_ACCOUNT_PATH);
  return new google.auth.GoogleAuth({
    keyFile: keyFilePath,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

function getSheetsClient() {
  const auth = getAuth();
  return google.sheets({ version: 'v4', auth });
}

const SPREADSHEET_ID = process.env.SPREADSHEET_ID;

// ──────────────────────────────────────────────
// Helper: Konversi baris array → objek bernama
// ──────────────────────────────────────────────
function rowsToObjects(rows, headers) {
  if (!rows || rows.length === 0) return [];
  return rows.map(row => {
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = row[i] !== undefined ? row[i] : '';
    });
    return obj;
  });
}

// ──────────────────────────────────────────────
// Helper: Cari nomor baris berdasarkan ID
// ──────────────────────────────────────────────
async function findRowByID(sheets, sheetName, id) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A:A`,
  });
  const rows = res.data.values || [];
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === id) return i + 1; // Nomor baris (1-indexed, skip header)
  }
  return null;
}

// ──────────────────────────────────────────────
// Helper: Generate ID unik
// ──────────────────────────────────────────────
function generateID(prefix) {
  const timestamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 5).toUpperCase();
  if (prefix === 'JDW') return `JDW-${timestamp}${rand}`;
  return prefix;
}

async function generateSequentialID(sheets, sheetName, prefix) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A:A`,
  });
  const rows = res.data.values || [];
  const count = Math.max(rows.length - 1, 0); // minus header
  const nextNum = String(count + 1).padStart(3, '0');
  return `${prefix}-${nextNum}`;
}

// ══════════════════════════════════════════════
// MODUL: JADWAL SIARAN
// ══════════════════════════════════════════════
const JADWAL_HEADERS = [
  'ID_Jadwal', 'Hari', 'Jam_Mulai', 'Jam_Selesai',
  'Nama_Program', 'Jenis_Siaran', 'ID_Rekanan', 'Keterangan'
];

const jadwal = {
  async getAll() {
    const sheets = getSheetsClient();
    const sheetName = process.env.SHEET_JADWAL;
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `Jadwal_Siaran!A2:H`,
    });
    return rowsToObjects(res.data.values, JADWAL_HEADERS);
  },

  async create(data) {
    const sheets = getSheetsClient();
    const sheetName = process.env.SHEET_JADWAL;
    const id = generateID('JDW');
    const row = [
      id,
      data.Hari,
      data.Jam_Mulai,
      data.Jam_Selesai,
      data.Nama_Program,
      data.Jenis_Siaran,
      data.ID_Rekanan || '',
      data.Keterangan || ''
    ];
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A:H`,
      valueInputOption: 'USER_ENTERED',
      resource: { values: [row] },
    });
    return { ID_Jadwal: id, ...data };
  },

  async update(id, data) {
    const sheets = getSheetsClient();
    const sheetName = process.env.SHEET_JADWAL;
    const rowNum = await findRowByID(sheets, sheetName, id);
    if (!rowNum) throw new Error(`ID Jadwal '${id}' tidak ditemukan`);
    const row = [
      id,
      data.Hari,
      data.Jam_Mulai,
      data.Jam_Selesai,
      data.Nama_Program,
      data.Jenis_Siaran,
      data.ID_Rekanan || '',
      data.Keterangan || ''
    ];
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A${rowNum}:H${rowNum}`,
      valueInputOption: 'USER_ENTERED',
      resource: { values: [row] },
    });
    return { ID_Jadwal: id, ...data };
  },

  async delete(id) {
    const sheets = getSheetsClient();
    const sheetName = process.env.SHEET_JADWAL;
    const rowNum = await findRowByID(sheets, sheetName, id);
    if (!rowNum) throw new Error(`ID Jadwal '${id}' tidak ditemukan`);
    // Dapatkan sheet ID numerik
    const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
    const sheet = meta.data.sheets.find(s => s.properties.title === sheetName);
    if (!sheet) throw new Error('Sheet tidak ditemukan');
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      resource: {
        requests: [{
          deleteDimension: {
            range: {
              sheetId: sheet.properties.sheetId,
              dimension: 'ROWS',
              startIndex: rowNum - 1,
              endIndex: rowNum,
            }
          }
        }]
      }
    });
    return { deleted: id };
  }
};

// ══════════════════════════════════════════════
// MODUL: REKANAN PNBP
// ══════════════════════════════════════════════
const PNBP_HEADERS = [
  'ID_Rekanan', 'Nama_Instansi', 'PIC_Nama', 'PIC_Kontak',
  'Nilai_Kontrak', 'Nomor_Kontrak', 'Tanggal_Mulai', 'Tanggal_Berakhir',
  'Status_Pembayaran', 'Status_Dokumen'
];

const rekananPNBP = {
  async getAll() {
    const sheets = getSheetsClient();
    const sheetName = process.env.SHEET_PNBP;
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A2:J`,
    });
    return rowsToObjects(res.data.values, PNBP_HEADERS);
  },

  async create(data) {
    const sheets = getSheetsClient();
    const sheetName = process.env.SHEET_PNBP;
    const id = await generateSequentialID(sheets, sheetName, 'PNBP');
    const row = [
      id,
      data.Nama_Instansi,
      data.PIC_Nama,
      data.PIC_Kontak,
      data.Nilai_Kontrak,
      data.Nomor_Kontrak,
      data.Tanggal_Mulai,
      data.Tanggal_Berakhir,
      data.Status_Pembayaran,
      data.Status_Dokumen
    ];
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A:J`,
      valueInputOption: 'USER_ENTERED',
      resource: { values: [row] },
    });
    return { ID_Rekanan: id, ...data };
  },

  async update(id, data) {
    const sheets = getSheetsClient();
    const sheetName = process.env.SHEET_PNBP;
    const rowNum = await findRowByID(sheets, sheetName, id);
    if (!rowNum) throw new Error(`ID Rekanan PNBP '${id}' tidak ditemukan`);
    const row = [
      id,
      data.Nama_Instansi,
      data.PIC_Nama,
      data.PIC_Kontak,
      data.Nilai_Kontrak,
      data.Nomor_Kontrak,
      data.Tanggal_Mulai,
      data.Tanggal_Berakhir,
      data.Status_Pembayaran,
      data.Status_Dokumen
    ];
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A${rowNum}:J${rowNum}`,
      valueInputOption: 'USER_ENTERED',
      resource: { values: [row] },
    });
    return { ID_Rekanan: id, ...data };
  },

  async delete(id) {
    const sheets = getSheetsClient();
    const sheetName = process.env.SHEET_PNBP;
    const rowNum = await findRowByID(sheets, sheetName, id);
    if (!rowNum) throw new Error(`ID Rekanan '${id}' tidak ditemukan`);
    const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
    const sheet = meta.data.sheets.find(s => s.properties.title === sheetName);
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      resource: {
        requests: [{
          deleteDimension: {
            range: {
              sheetId: sheet.properties.sheetId,
              dimension: 'ROWS',
              startIndex: rowNum - 1,
              endIndex: rowNum,
            }
          }
        }]
      }
    });
    return { deleted: id };
  }
};

// ══════════════════════════════════════════════
// MODUL: REKANAN NON-PNBP
// ══════════════════════════════════════════════
const NONPNBP_HEADERS = [
  'ID_Rekanan', 'Nama_Instansi', 'PIC_Nama', 'PIC_Kontak',
  'Bentuk_Barter', 'Tanggal_Mulai', 'Tanggal_Berakhir', 'Status_Dokumen'
];

const rekananNonPNBP = {
  async getAll() {
    const sheets = getSheetsClient();
    const sheetName = process.env.SHEET_NONPNBP;
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `Jadwal_Siaran!A2:H`,
    });
    return rowsToObjects(res.data.values, NONPNBP_HEADERS);
  },

  async create(data) {
    const sheets = getSheetsClient();
    const sheetName = process.env.SHEET_NONPNBP;
    const id = await generateSequentialID(sheets, sheetName, 'NON');
    const row = [
      id,
      data.Nama_Instansi,
      data.PIC_Nama,
      data.PIC_Kontak,
      data.Bentuk_Barter,
      data.Tanggal_Mulai,
      data.Tanggal_Berakhir,
      data.Status_Dokumen
    ];
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A:H`,
      valueInputOption: 'USER_ENTERED',
      resource: { values: [row] },
    });
    return { ID_Rekanan: id, ...data };
  },

  async update(id, data) {
    const sheets = getSheetsClient();
    const sheetName = process.env.SHEET_NONPNBP;
    const rowNum = await findRowByID(sheets, sheetName, id);
    if (!rowNum) throw new Error(`ID Rekanan Non-PNBP '${id}' tidak ditemukan`);
    const row = [
      id,
      data.Nama_Instansi,
      data.PIC_Nama,
      data.PIC_Kontak,
      data.Bentuk_Barter,
      data.Tanggal_Mulai,
      data.Tanggal_Berakhir,
      data.Status_Dokumen
    ];
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A${rowNum}:H${rowNum}`,
      valueInputOption: 'USER_ENTERED',
      resource: { values: [row] },
    });
    return { ID_Rekanan: id, ...data };
  },

  async delete(id) {
    const sheets = getSheetsClient();
    const sheetName = process.env.SHEET_NONPNBP;
    const rowNum = await findRowByID(sheets, sheetName, id);
    if (!rowNum) throw new Error(`ID Rekanan '${id}' tidak ditemukan`);
    const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
    const sheet = meta.data.sheets.find(s => s.properties.title === sheetName);
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      resource: {
        requests: [{
          deleteDimension: {
            range: {
              sheetId: sheet.properties.sheetId,
              dimension: 'ROWS',
              startIndex: rowNum - 1,
              endIndex: rowNum,
            }
          }
        }]
      }
    });
    return { deleted: id };
  }
};

// ══════════════════════════════════════════════
// MODUL: DASHBOARD — Data agregat
// ══════════════════════════════════════════════
const dashboard = {
  async getSummary() {
    const [allJadwal, allPNBP, allNonPNBP] = await Promise.all([
      jadwal.getAll(),
      rekananPNBP.getAll(),
      rekananNonPNBP.getAll()
    ]);

    const today = new Date();
    const in30Days = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Hitung program aktif minggu ini
    const hariUrut = ['Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu'];
    const hariIni = hariUrut[today.getDay() === 0 ? 6 : today.getDay() - 1];
    const programHariIni = allJadwal.filter(j => j.Hari === hariIni);

    // Nilai PNBP total aktif
    const totalNilaiPNBP = allPNBP.reduce((sum, r) => {
      const expired = r.Tanggal_Berakhir && new Date(r.Tanggal_Berakhir) < today;
      if (!expired) sum += parseFloat(r.Nilai_Kontrak) || 0;
      return sum;
    }, 0);

    // Mitra aktif (belum expired)
    const mitraAktifPNBP = allPNBP.filter(r =>
      !r.Tanggal_Berakhir || new Date(r.Tanggal_Berakhir) >= today
    ).length;
    const mitraAktifNonPNBP = allNonPNBP.filter(r =>
      !r.Tanggal_Berakhir || new Date(r.Tanggal_Berakhir) >= today
    ).length;

    // Kontrak hampir berakhir (<= 30 hari)
    const kontrakHampirBerakhir = [
      ...allPNBP.map(r => ({ ...r, tipe: 'PNBP' })),
      ...allNonPNBP.map(r => ({ ...r, tipe: 'Non-PNBP' }))
    ].filter(r => {
      if (!r.Tanggal_Berakhir) return false;
      const exp = new Date(r.Tanggal_Berakhir);
      return exp >= today && exp <= in30Days;
    }).map(r => {
      const exp = new Date(r.Tanggal_Berakhir);
      const sisaHari = Math.ceil((exp - today) / (1000 * 60 * 60 * 24));
      return { ...r, sisa_hari: sisaHari };
    }).sort((a, b) => a.sisa_hari - b.sisa_hari);

    return {
      program_aktif_minggu_ini: allJadwal.length,
      program_hari_ini: programHariIni.length,
      total_nilai_pnbp: totalNilaiPNBP,
      total_mitra_aktif: mitraAktifPNBP + mitraAktifNonPNBP,
      mitra_pnbp: mitraAktifPNBP,
      mitra_nonpnbp: mitraAktifNonPNBP,
      kontrak_hampir_berakhir: kontrakHampirBerakhir,
      jadwal_hari_ini: programHariIni,
    };
  }
};

module.exports = { jadwal, rekananPNBP, rekananNonPNBP, dashboard };
