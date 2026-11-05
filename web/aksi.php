<?php
require __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: index.php');
    exit;
}

$aksi     = $_POST['aksi'] ?? '';
$id       = (int) ($_POST['id'] ?? 0);
$nim      = trim($_POST['nim'] ?? '');
$nama     = trim($_POST['nama'] ?? '');
$prodi    = trim($_POST['prodi'] ?? '');
$angkatan = (int) ($_POST['angkatan'] ?? 0);
$email    = trim($_POST['email'] ?? '');

try {
    $pdo = db();

    switch ($aksi) {
        case 'tambah':
            if ($nim === '' || $nama === '' || $prodi === '' || $angkatan === 0 || $email === '') {
                throw new RuntimeException('Form belum lengkap');
            }
            $stmt = $pdo->prepare(
                'INSERT INTO mahasiswa (nim, nama, prodi, angkatan, email)
                 VALUES (:nim, :nama, :prodi, :angkatan, :email)'
            );
            $stmt->execute([
                ':nim' => $nim, ':nama' => $nama, ':prodi' => $prodi,
                ':angkatan' => $angkatan, ':email' => $email,
            ]);
            header('Location: index.php?msg=tambah');
            break;

        case 'ubah':
            if ($id === 0 || $nim === '' || $nama === '' || $prodi === '' || $angkatan === 0 || $email === '') {
                throw new RuntimeException('Form belum lengkap');
            }
            $stmt = $pdo->prepare(
                'UPDATE mahasiswa
                 SET nim = :nim, nama = :nama, prodi = :prodi, angkatan = :angkatan, email = :email
                 WHERE id = :id'
            );
            $stmt->execute([
                ':nim' => $nim, ':nama' => $nama, ':prodi' => $prodi,
                ':angkatan' => $angkatan, ':email' => $email, ':id' => $id,
            ]);
            header('Location: index.php?msg=ubah');
            break;

        case 'hapus':
            $stmt = $pdo->prepare('DELETE FROM mahasiswa WHERE id = :id');
            $stmt->execute([':id' => $id]);
            header('Location: index.php?msg=hapus');
            break;

        default:
            header('Location: index.php');
    }
} catch (Throwable $ex) {
    header('Location: index.php?msg=gagal');
}
exit;
