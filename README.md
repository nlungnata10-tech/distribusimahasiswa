# Web Data Mahasiswa (Node.js + MySQL XAMPP)

Database TIDAK diubah: pakai `db_kampus.sql` yang sama (db_kampus, tabel mahasiswa, user webuser/webpass123).

## Cara menjalankan (file utama: app.js)
1. Install Node.js (https://nodejs.org, versi LTS).
2. Buka folder ini di terminal, lalu:
   npm install
3. Edit `config.js`, isi DB_HOST dengan IP VM Database (atau localhost kalau satu komputer).
4. Pastikan MySQL XAMPP di VM Database sudah Start dan db_kampus.sql sudah di-import.
5. Jalankan:
   npm start   (web + API: node app.js | API saja: node api.js)
6. Buka http://localhost:3000 (dari host: http://IP-VM-WEB:3000, buka firewall port 3000).

## REST API (JSON)
Base URL: http://localhost:3000/api

| Method | URL                    | Keterangan                       |
|--------|------------------------|----------------------------------|
| GET    | /api/mahasiswa         | Semua data (opsional ?q=kata)    |
| GET    | /api/mahasiswa/:id     | Satu data                        |
| POST   | /api/mahasiswa         | Tambah data (201)                |
| PUT    | /api/mahasiswa/:id     | Ubah data                        |
| DELETE | /api/mahasiswa/:id     | Hapus data                       |

Body JSON untuk POST/PUT:
{ "nim": "2024010099", "nama": "Nama", "prodi": "Teknik Informatika", "angkatan": 2024, "email": "nama@email.com" }

Kode respons: 200/201 sukses, 400 validasi gagal, 404 tidak ditemukan, 409 NIM duplikat, 500 error server/database.

Contoh (PowerShell):
  Invoke-RestMethod http://localhost:3000/api/mahasiswa
  Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/mahasiswa -ContentType "application/json" -Body '{"nim":"2024010099","nama":"Tes","prodi":"Sistem Informasi","angkatan":2024,"email":"tes@email.com"}'
Contoh (cmd/curl):
  curl http://localhost:3000/api/mahasiswa
