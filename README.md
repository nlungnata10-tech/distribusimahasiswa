# Web Data Mahasiswa (Node.js + MySQL XAMPP)

Database TIDAK diubah: pakai `db_kampus.sql` yang sama (db_kampus, tabel mahasiswa, user webuser/webpass123).

## Cara menjalankan (VM 1 / Web)
1. Install Node.js (https://nodejs.org, versi LTS).
2. Buka folder ini di terminal, lalu:
   npm install
3. Edit `config.js`, isi DB_HOST dengan IP VM Database (atau localhost kalau satu komputer).
4. Pastikan MySQL XAMPP di VM Database sudah Start dan db_kampus.sql sudah di-import.
5. Jalankan:
   npm start
6. Buka http://localhost:3000 (dari host: http://IP-VM-WEB:3000, buka firewall port 3000).
