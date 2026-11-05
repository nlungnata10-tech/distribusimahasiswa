// REST API Mahasiswa (JSON). Database: tabel mahasiswa di db_kampus (tidak diubah).
const MAX_BODY = 1e6;

function json(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(data === null ? '' : JSON.stringify(data, null, 2));
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (c) => {
      raw += c;
      if (raw.length > MAX_BODY) {
        reject({ status: 413, message: 'Body terlalu besar' });
        req.destroy();
      }
    });
    req.on('end', () => {
      if (!raw.trim()) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject({ status: 400, message: 'Body harus berupa JSON yang valid' });
      }
    });
    req.on('error', () => reject({ status: 400, message: 'Gagal membaca body' }));
  });
}

// Validasi & normalisasi input. Mengembalikan { data } atau { errors }
function validasi(b) {
  const data = {
    nim: String(b.nim ?? '').trim(),
    nama: String(b.nama ?? '').trim(),
    prodi: String(b.prodi ?? '').trim(),
    angkatan: parseInt(b.angkatan, 10),
    email: String(b.email ?? '').trim(),
  };
  const errors = {};
  if (!data.nim) errors.nim = 'wajib diisi';
  else if (data.nim.length > 20) errors.nim = 'maksimal 20 karakter';
  if (!data.nama) errors.nama = 'wajib diisi';
  else if (data.nama.length > 100) errors.nama = 'maksimal 100 karakter';
  if (!data.prodi) errors.prodi = 'wajib diisi';
  else if (data.prodi.length > 60) errors.prodi = 'maksimal 60 karakter';
  if (!Number.isInteger(data.angkatan) || data.angkatan < 2000 || data.angkatan > 2100)
    errors.angkatan = 'harus angka antara 2000 dan 2100';
  if (!data.email) errors.email = 'wajib diisi';
  else if (data.email.length > 100) errors.email = 'maksimal 100 karakter';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = 'format email tidak valid';
  return Object.keys(errors).length ? { errors } : { data };
}

function createApi(pool) {
  // return true jika request ditangani
  return async function handle(req, res, url) {
    const m = url.pathname.match(/^\/api(?:\/mahasiswa(?:\/(\d+))?)?\/?$/);
    if (!m) {
      if (url.pathname.startsWith('/api')) {
        json(res, 404, { success: false, message: 'Endpoint tidak ditemukan' });
        return true;
      }
      return false;
    }

    if (req.method === 'OPTIONS') {
      json(res, 204, null);
      return true;
    }

    const id = m[1] ? parseInt(m[1], 10) : null;
    const isRoot = url.pathname.replace(/\/$/, '') === '/api';

    try {
      // GET /api -> info
      if (isRoot && req.method === 'GET') {
        json(res, 200, {
          success: true,
          name: 'API Data Mahasiswa',
          endpoints: [
            'GET    /api/mahasiswa?q=kata',
            'GET    /api/mahasiswa/:id',
            'POST   /api/mahasiswa',
            'PUT    /api/mahasiswa/:id',
            'DELETE /api/mahasiswa/:id',
          ],
        });
        return true;
      }

      // GET /api/mahasiswa
      if (id === null && req.method === 'GET') {
        const q = (url.searchParams.get('q') || '').trim();
        let rows;
        if (q) {
          const like = `%${q}%`;
          [rows] = await pool.query(
            'SELECT * FROM mahasiswa WHERE nim LIKE ? OR nama LIKE ? OR prodi LIKE ? ORDER BY id DESC',
            [like, like, like]
          );
        } else {
          [rows] = await pool.query('SELECT * FROM mahasiswa ORDER BY id DESC');
        }
        json(res, 200, { success: true, total: rows.length, data: rows });
        return true;
      }

      // POST /api/mahasiswa
      if (id === null && req.method === 'POST') {
        const v = validasi(await readJson(req));
        if (v.errors) return json(res, 400, { success: false, message: 'Validasi gagal', errors: v.errors }), true;
        const d = v.data;
        const [r] = await pool.execute(
          'INSERT INTO mahasiswa (nim, nama, prodi, angkatan, email) VALUES (?, ?, ?, ?, ?)',
          [d.nim, d.nama, d.prodi, d.angkatan, d.email]
        );
        const [[row]] = await pool.query('SELECT * FROM mahasiswa WHERE id = ?', [r.insertId]);
        json(res, 201, { success: true, message: 'Data berhasil ditambahkan', data: row });
        return true;
      }

      if (id !== null) {
        // GET /api/mahasiswa/:id
        if (req.method === 'GET') {
          const [[row]] = await pool.query('SELECT * FROM mahasiswa WHERE id = ?', [id]);
          if (!row) return json(res, 404, { success: false, message: 'Data tidak ditemukan' }), true;
          json(res, 200, { success: true, data: row });
          return true;
        }

        // PUT /api/mahasiswa/:id
        if (req.method === 'PUT') {
          const v = validasi(await readJson(req));
          if (v.errors) return json(res, 400, { success: false, message: 'Validasi gagal', errors: v.errors }), true;
          const d = v.data;
          const [r] = await pool.execute(
            'UPDATE mahasiswa SET nim = ?, nama = ?, prodi = ?, angkatan = ?, email = ? WHERE id = ?',
            [d.nim, d.nama, d.prodi, d.angkatan, d.email, id]
          );
          if (r.affectedRows === 0) return json(res, 404, { success: false, message: 'Data tidak ditemukan' }), true;
          const [[row]] = await pool.query('SELECT * FROM mahasiswa WHERE id = ?', [id]);
          json(res, 200, { success: true, message: 'Data berhasil diperbarui', data: row });
          return true;
        }

        // DELETE /api/mahasiswa/:id
        if (req.method === 'DELETE') {
          const [r] = await pool.execute('DELETE FROM mahasiswa WHERE id = ?', [id]);
          if (r.affectedRows === 0) return json(res, 404, { success: false, message: 'Data tidak ditemukan' }), true;
          json(res, 200, { success: true, message: 'Data berhasil dihapus' });
          return true;
        }
      }

      json(res, 405, { success: false, message: 'Method tidak diizinkan' });
      return true;
    } catch (err) {
      if (err && err.status) {
        json(res, err.status, { success: false, message: err.message });
      } else if (err && err.code === 'ER_DUP_ENTRY') {
        json(res, 409, { success: false, message: 'NIM sudah terdaftar' });
      } else {
        console.error('[api]', err);
        json(res, 500, { success: false, message: 'Kesalahan server / database', detail: err.message });
      }
      return true;
    }
  };
}

module.exports = { createApi };
