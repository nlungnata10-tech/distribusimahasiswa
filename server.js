const http = require('http');
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const cfg = require('./config');

const pool = mysql.createPool({
  host: cfg.DB_HOST,
  port: cfg.DB_PORT,
  database: cfg.DB_NAME,
  user: cfg.DB_USER,
  password: cfg.DB_PASS,
  charset: 'utf8mb4',
  connectTimeout: 5000,
  waitForConnections: true,
  connectionLimit: 5,
});

const PRODI = [
  'Teknik Informatika',
  'Sistem Informasi',
  'Teknik Komputer',
  'Manajemen Informatika',
  'Desain Komunikasi Visual',
];

const FLASH = {
  tambah: 'Data mahasiswa berhasil ditambahkan.',
  ubah: 'Data mahasiswa berhasil diperbarui.',
  hapus: 'Data mahasiswa berhasil dihapus.',
  gagal: 'Terjadi kesalahan. Cek NIM (tidak boleh duplikat) dan isian form.',
};

const e = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (c) => {
      data += c;
      if (data.length > 1e6) {
        reject(new Error('Body terlalu besar'));
        req.destroy();
      }
    });
    req.on('end', () => resolve(Object.fromEntries(new URLSearchParams(data))));
    req.on('error', reject);
  });
}

function redirect(res, location) {
  res.writeHead(303, { Location: location });
  res.end();
}

function sendHtml(res, status, html) {
  res.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
}

function renderPage({ error, rows, total, prodiCount, q, flash }) {
  const flashText = FLASH[flash] || '';
  let body;

  if (error) {
    body = `
    <section class="alert alert-error">
      <strong>Gagal terhubung ke database.</strong>
      <p>Cek IP VM Database di <code>config.js</code>, firewall port 3306, dan user MySQL.</p>
      <pre>${e(error)}</pre>
    </section>`;
  } else {
    const trs = rows.length
      ? rows
          .map(
            (r) => `
          <tr>
            <td><code>${e(r.nim)}</code></td>
            <td><strong>${e(r.nama)}</strong></td>
            <td><span class="pill">${e(r.prodi)}</span></td>
            <td>${e(r.angkatan)}</td>
            <td class="muted">${e(r.email)}</td>
            <td class="right">
              <button class="btn btn-small"
                data-id="${Number(r.id)}"
                data-nim="${e(r.nim)}"
                data-nama="${e(r.nama)}"
                data-prodi="${e(r.prodi)}"
                data-angkatan="${e(r.angkatan)}"
                data-email="${e(r.email)}"
                onclick="bukaForm(this)">Edit</button>
              <form method="post" action="/aksi" class="inline" data-nama="${e(r.nama)}"
                onsubmit="return confirm('Hapus data ' + this.dataset.nama + '?')">
                <input type="hidden" name="aksi" value="hapus">
                <input type="hidden" name="id" value="${Number(r.id)}">
                <button class="btn btn-small btn-danger">Hapus</button>
              </form>
            </td>
          </tr>`
          )
          .join('')
      : `<tr><td colspan="6" class="empty">Belum ada data${q ? ' untuk pencarian ini' : ''}.</td></tr>`;

    body = `
    ${flashText ? `<div class="alert ${flash === 'gagal' ? 'alert-error' : 'alert-ok'}">${e(flashText)}</div>` : ''}

    <section class="stats">
      <div class="card stat"><span class="stat-label">Total Mahasiswa</span><span class="stat-value">${total}</span></div>
      <div class="card stat"><span class="stat-label">Program Studi</span><span class="stat-value">${prodiCount}</span></div>
      <div class="card stat"><span class="stat-label">Database Host</span>
        <span class="stat-value small"><span class="dot"></span>${e(cfg.DB_HOST)}</span></div>
    </section>

    <section class="card">
      <div class="toolbar">
        <form method="get" action="/" class="search">
          <input type="search" name="q" value="${e(q)}" placeholder="Cari NIM, nama, atau prodi...">
          <button type="submit" class="btn btn-ghost">Cari</button>
        </form>
        <button class="btn btn-primary" onclick="bukaForm()">+ Tambah Mahasiswa</button>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr>
            <th>NIM</th><th>Nama</th><th>Program Studi</th><th>Angkatan</th><th>Email</th><th class="right">Aksi</th>
          </tr></thead>
          <tbody>${trs}</tbody>
        </table>
      </div>
    </section>`;
  }

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Data Mahasiswa | Tugas VirtualBox</title>
  <link rel="stylesheet" href="/style.css">
</head>
<body>

<header class="hero">
  <div class="container">
    <span class="badge">Tugas VirtualBox &middot; 2 VM</span>
    <h1>Data Mahasiswa</h1>
    <p>Web server Node.js (VM 1) terhubung ke database MySQL XAMPP (VM 2) lewat jaringan VirtualBox.</p>
  </div>
</header>

<main class="container">
${body}
</main>

<footer class="container foot">Dibuat dengan Node.js + MySQL &middot; XAMPP &middot; VirtualBox</footer>

<dialog id="modal">
  <form method="post" action="/aksi" class="form">
    <h2 id="judulForm">Tambah Mahasiswa</h2>
    <input type="hidden" name="aksi" id="fAksi" value="tambah">
    <input type="hidden" name="id" id="fId">

    <label>NIM
      <input name="nim" id="fNim" required maxlength="20" placeholder="contoh: 2024010001">
    </label>
    <label>Nama Lengkap
      <input name="nama" id="fNama" required maxlength="100" placeholder="Nama mahasiswa">
    </label>
    <label>Program Studi
      <select name="prodi" id="fProdi" required>
        <option value="">-- pilih --</option>
        ${PRODI.map((p) => `<option>${e(p)}</option>`).join('\n        ')}
      </select>
    </label>
    <div class="grid2">
      <label>Angkatan
        <input type="number" name="angkatan" id="fAngkatan" required min="2000" max="2100" value="2024">
      </label>
      <label>Email
        <input type="email" name="email" id="fEmail" required maxlength="100" placeholder="nama@email.com">
      </label>
    </div>

    <div class="actions">
      <button type="button" class="btn btn-ghost" onclick="document.getElementById('modal').close()">Batal</button>
      <button type="submit" class="btn btn-primary">Simpan</button>
    </div>
  </form>
</dialog>

<script>
function bukaForm(btn) {
  const m = document.getElementById('modal');
  const edit = !!btn;
  document.getElementById('judulForm').textContent = edit ? 'Edit Mahasiswa' : 'Tambah Mahasiswa';
  document.getElementById('fAksi').value = edit ? 'ubah' : 'tambah';
  document.getElementById('fId').value       = edit ? btn.dataset.id : '';
  document.getElementById('fNim').value      = edit ? btn.dataset.nim : '';
  document.getElementById('fNama').value     = edit ? btn.dataset.nama : '';
  document.getElementById('fProdi').value    = edit ? btn.dataset.prodi : '';
  document.getElementById('fAngkatan').value = edit ? btn.dataset.angkatan : '2024';
  document.getElementById('fEmail').value    = edit ? btn.dataset.email : '';
  m.showModal();
}
document.getElementById('modal').addEventListener('click', function (ev) {
  if (ev.target === this) this.close();
});
</script>
</body>
</html>`;
}

async function halamanUtama(req, res, url) {
  const q = (url.searchParams.get('q') || '').trim();
  const flash = url.searchParams.get('msg') || '';
  const state = { error: null, rows: [], total: 0, prodiCount: 0, q, flash };

  try {
    if (q) {
      const like = `%${q}%`;
      [state.rows] = await pool.query(
        'SELECT * FROM mahasiswa WHERE nim LIKE ? OR nama LIKE ? OR prodi LIKE ? ORDER BY id DESC',
        [like, like, like]
      );
    } else {
      [state.rows] = await pool.query('SELECT * FROM mahasiswa ORDER BY id DESC');
    }
    const [[t]] = await pool.query('SELECT COUNT(*) AS c FROM mahasiswa');
    const [[p]] = await pool.query('SELECT COUNT(DISTINCT prodi) AS c FROM mahasiswa');
    state.total = Number(t.c);
    state.prodiCount = Number(p.c);
  } catch (err) {
    state.error = err.message;
  }
  sendHtml(res, state.error ? 500 : 200, renderPage(state));
}

async function aksi(req, res) {
  try {
    const b = await readBody(req);
    const act = b.aksi || '';
    const id = parseInt(b.id, 10) || 0;
    const nim = (b.nim || '').trim();
    const nama = (b.nama || '').trim();
    const prodi = (b.prodi || '').trim();
    const angkatan = parseInt(b.angkatan, 10) || 0;
    const email = (b.email || '').trim();
    const lengkap = nim && nama && prodi && angkatan && email;

    if (act === 'tambah') {
      if (!lengkap) throw new Error('Form belum lengkap');
      await pool.execute(
        'INSERT INTO mahasiswa (nim, nama, prodi, angkatan, email) VALUES (?, ?, ?, ?, ?)',
        [nim, nama, prodi, angkatan, email]
      );
      return redirect(res, '/?msg=tambah');
    }
    if (act === 'ubah') {
      if (!id || !lengkap) throw new Error('Form belum lengkap');
      await pool.execute(
        'UPDATE mahasiswa SET nim = ?, nama = ?, prodi = ?, angkatan = ?, email = ? WHERE id = ?',
        [nim, nama, prodi, angkatan, email, id]
      );
      return redirect(res, '/?msg=ubah');
    }
    if (act === 'hapus') {
      await pool.execute('DELETE FROM mahasiswa WHERE id = ?', [id]);
      return redirect(res, '/?msg=hapus');
    }
    redirect(res, '/');
  } catch (err) {
    console.error('[aksi]', err.message);
    redirect(res, '/?msg=gagal');
  }
}

function fileStatis(req, res, pathname) {
  const dir = path.join(__dirname, 'public');
  const file = path.normalize(path.join(dir, pathname));
  if (!file.startsWith(dir + path.sep)) return notFound(res);
  const types = { '.css': 'text/css; charset=utf-8', '.js': 'text/javascript', '.png': 'image/png', '.ico': 'image/x-icon' };
  fs.readFile(file, (err, data) => {
    if (err) return notFound(res);
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
    res.end(data);
  });
}

function notFound(res) {
  sendHtml(res, 404, '<h1>404 - Halaman tidak ditemukan</h1><p><a href="/">Kembali</a></p>');
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  try {
    if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/index.php')) {
      return await halamanUtama(req, res, url);
    }
    if (url.pathname === '/aksi') {
      if (req.method !== 'POST') return redirect(res, '/');
      return await aksi(req, res);
    }
    if (req.method === 'GET') return fileStatis(req, res, url.pathname);
    notFound(res);
  } catch (err) {
    console.error(err);
    sendHtml(res, 500, '<h1>500 - Kesalahan server</h1>');
  }
});

server.listen(cfg.PORT, '0.0.0.0', () => {
  console.log(`Server jalan di http://localhost:${cfg.PORT}`);
  console.log(`Database: ${cfg.DB_USER}@${cfg.DB_HOST}:${cfg.DB_PORT}/${cfg.DB_NAME}`);
});
