// ============================================
// KONFIGURASI KONEKSI DATABASE (MySQL XAMPP)
// Database tidak diubah: db_kampus, user webuser.
// Ganti DB_HOST dengan IP VM Database kamu
// (atau 'localhost' kalau MySQL XAMPP satu komputer).
// Bisa juga lewat environment variable.
// ============================================
module.exports = {
  PORT: process.env.PORT || 3000,
  DB_HOST: process.env.DB_HOST || '192.168.56.20', // <-- IP VM DATABASE
  DB_PORT: Number(process.env.DB_PORT || 3306),
  DB_NAME: process.env.DB_NAME || 'db_kampus',
  DB_USER: process.env.DB_USER || 'webuser',
  DB_PASS: process.env.DB_PASS || 'webpass123',
};
