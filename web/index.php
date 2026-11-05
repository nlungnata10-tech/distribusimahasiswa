<?php
require __DIR__ . '/config.php';

$error = null;
$rows = [];
$total = 0;
$prodiCount = 0;
$q = trim($_GET['q'] ?? '');

try {
    $pdo = db();

    if ($q !== '') {
        $stmt = $pdo->prepare(
            'SELECT * FROM mahasiswa
             WHERE nim LIKE :q OR nama LIKE :q OR prodi LIKE :q
             ORDER BY id DESC'
        );
        $stmt->execute([':q' => "%$q%"]);
    } else {
        $stmt = $pdo->query('SELECT * FROM mahasiswa ORDER BY id DESC');
    }
    $rows = $stmt->fetchAll();

    $total      = (int) $pdo->query('SELECT COUNT(*) FROM mahasiswa')->fetchColumn();
    $prodiCount = (int) $pdo->query('SELECT COUNT(DISTINCT prodi) FROM mahasiswa')->fetchColumn();
} catch (PDOException $ex) {
    $error = $ex->getMessage();
}

$flash = $_GET['msg'] ?? '';
$flashText = [
    'tambah' => 'Data mahasiswa berhasil ditambahkan.',
    'ubah'   => 'Data mahasiswa berhasil diperbarui.',
    'hapus'  => 'Data mahasiswa berhasil dihapus.',
    'gagal'  => 'Terjadi kesalahan. Cek NIM (tidak boleh duplikat) dan isian form.',
][$flash] ?? '';
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Data Mahasiswa | Tugas VirtualBox</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>

<header class="hero">
    <div class="container">
        <span class="badge">Tugas VirtualBox &middot; 2 VM</span>
        <h1>Data Mahasiswa</h1>
        <p>Web server (VM 1) terhubung ke database MySQL (VM 2) lewat jaringan VirtualBox.</p>
    </div>
</header>

<main class="container">

    <?php if ($error): ?>
        <section class="alert alert-error">
            <strong>Gagal terhubung ke database.</strong>
            <p>Cek IP VM Database di <code>config.php</code>, firewall port 3306, dan user MySQL.</p>
            <pre><?= e($error) ?></pre>
        </section>
    <?php else: ?>

        <?php if ($flashText): ?>
            <div class="alert <?= $flash === 'gagal' ? 'alert-error' : 'alert-ok' ?>"><?= e($flashText) ?></div>
        <?php endif; ?>

        <section class="stats">
            <div class="card stat">
                <span class="stat-label">Total Mahasiswa</span>
                <span class="stat-value"><?= $total ?></span>
            </div>
            <div class="card stat">
                <span class="stat-label">Program Studi</span>
                <span class="stat-value"><?= $prodiCount ?></span>
            </div>
            <div class="card stat">
                <span class="stat-label">Database Host</span>
                <span class="stat-value small"><span class="dot"></span><?= e(DB_HOST) ?></span>
            </div>
        </section>

        <section class="card">
            <div class="toolbar">
                <form method="get" class="search">
                    <input type="search" name="q" value="<?= e($q) ?>" placeholder="Cari NIM, nama, atau prodi...">
                    <button type="submit" class="btn btn-ghost">Cari</button>
                </form>
                <button class="btn btn-primary" onclick="bukaForm()">+ Tambah Mahasiswa</button>
            </div>

            <div class="table-wrap">
                <table>
                    <thead>
                    <tr>
                        <th>NIM</th>
                        <th>Nama</th>
                        <th>Program Studi</th>
                        <th>Angkatan</th>
                        <th>Email</th>
                        <th class="right">Aksi</th>
                    </tr>
                    </thead>
                    <tbody>
                    <?php if (!$rows): ?>
                        <tr><td colspan="6" class="empty">Belum ada data<?= $q !== '' ? ' untuk pencarian ini' : '' ?>.</td></tr>
                    <?php endif; ?>
                    <?php foreach ($rows as $r): ?>
                        <tr>
                            <td><code><?= e($r['nim']) ?></code></td>
                            <td><strong><?= e($r['nama']) ?></strong></td>
                            <td><span class="pill"><?= e($r['prodi']) ?></span></td>
                            <td><?= e((string) $r['angkatan']) ?></td>
                            <td class="muted"><?= e($r['email']) ?></td>
                            <td class="right">
                                <button class="btn btn-small"
                                        data-id="<?= (int) $r['id'] ?>"
                                        data-nim="<?= e($r['nim']) ?>"
                                        data-nama="<?= e($r['nama']) ?>"
                                        data-prodi="<?= e($r['prodi']) ?>"
                                        data-angkatan="<?= e((string) $r['angkatan']) ?>"
                                        data-email="<?= e($r['email']) ?>"
                                        onclick="bukaForm(this)">Edit</button>
                                <form method="post" action="aksi.php" class="inline"
                                      onsubmit="return confirm('Hapus data <?= e($r['nama']) ?>?')">
                                    <input type="hidden" name="aksi" value="hapus">
                                    <input type="hidden" name="id" value="<?= (int) $r['id'] ?>">
                                    <button class="btn btn-small btn-danger">Hapus</button>
                                </form>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
        </section>

    <?php endif; ?>
</main>

<footer class="container foot">
    Dibuat dengan PHP + MySQL &middot; XAMPP &middot; VirtualBox
</footer>

<!-- Modal form tambah / edit -->
<dialog id="modal">
    <form method="post" action="aksi.php" class="form">
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
                <option>Teknik Informatika</option>
                <option>Sistem Informasi</option>
                <option>Teknik Komputer</option>
                <option>Manajemen Informatika</option>
                <option>Desain Komunikasi Visual</option>
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
// tutup modal kalau klik area gelap
document.getElementById('modal').addEventListener('click', function (e) {
    if (e.target === this) this.close();
});
</script>
</body>
</html>
