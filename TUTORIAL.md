# Tutorial Tugas VirtualBox: 2 VM (Web + Database) dengan XAMPP

```
 ┌─────────────────────┐        ┌─────────────────────┐
 │  VM 1 : WEB SERVER  │        │  VM 2 : DATABASE    │
 │  XAMPP (Apache+PHP) │ ─────► │  XAMPP (MySQL)      │
 │  192.168.56.10      │  3306  │  192.168.56.20      │
 └─────────────────────┘        └─────────────────────┘
        ▲
        │ http://192.168.56.10
     Browser (laptop host)
```

> IP di atas hanya contoh. Pakai IP sesuai hasil `ipconfig` / `ip a` di VM kamu.

## Isi paket

```
tugas-vm/
├── web/                  -> masuk ke VM 1 (WEB)
│   ├── index.php
│   ├── aksi.php
│   ├── config.php        <- WAJIB edit IP database
│   └── style.css
├── database/
│   └── db_kampus.sql     -> import di VM 2 (DATABASE)
└── TUTORIAL.md
```

---

## BAGIAN 0 - Setting jaringan VirtualBox (kedua VM)

Supaya kedua VM bisa saling ping, dan host juga bisa buka web:

1. Matikan VM dulu. Buka **Settings > Network** untuk **masing-masing VM**.
2. **Adapter 1**: `NAT` (buat internet / download XAMPP).
3. **Adapter 2**: `Host-only Adapter` (nama: *VirtualBox Host-Only Ethernet Adapter*).
4. Nyalakan VM. Cek IP:
   - Windows: `ipconfig` (cari IP `192.168.56.x`)
   - Linux: `ip a`
5. Kalau IP belum ada di adapter host-only, set manual:
   - VM Web: `192.168.56.10`, subnet `255.255.255.0`
   - VM Database: `192.168.56.20`, subnet `255.255.255.0`
6. Tes ping dari VM Web ke VM Database:
   ```
   ping 192.168.56.20
   ```
   Kalau **Request timed out** di Windows, matikan sementara firewall atau izinkan ICMP (lihat Bagian 2 langkah 4).

> Alternatif: pakai **Bridged Adapter** di kedua VM (IP dari router yang sama). Langkah lainnya sama.

---

## BAGIAN 1 - VM 2 (DATABASE) - kerjain ini DULUAN

### 1. Install & jalankan XAMPP
- Install XAMPP di VM 2.
- Buka **XAMPP Control Panel**, klik **Start** pada **MySQL** (Apache boleh di-start juga, dipakai untuk phpMyAdmin).

### 2. Import database
**Cara A - lewat phpMyAdmin (paling gampang):**
1. Buka browser di VM 2: `http://localhost/phpmyadmin`
2. Klik tab **Import** > **Choose File** > pilih `db_kampus.sql` > klik **Import** (paling bawah).
3. Database `db_kampus` + tabel `mahasiswa` + user `webuser` akan terbuat otomatis.

**Cara B - lewat command line:**
```
cd C:\xampp\mysql\bin
mysql -u root < C:\path\ke\db_kampus.sql
```
(Linux XAMPP: `/opt/lampp/bin/mysql -u root < db_kampus.sql`)

### 3. Izinkan koneksi dari luar (remote)
Biasanya XAMPP MySQL sudah listen di semua interface. Cek di file konfigurasi:
- Windows: `C:\xampp\mysql\bin\my.ini`
- Linux: `/opt/lampp/etc/my.cnf`

Pastikan **tidak ada** baris `skip-networking` aktif dan kalau ada `bind-address`, ubah jadi:
```
bind-address = 0.0.0.0
```
Kalau kamu mengubah file ini, **Stop lalu Start ulang MySQL**.

### 4. Buka firewall port 3306
**Windows (PowerShell / CMD sebagai Administrator):**
```
netsh advfirewall firewall add rule name="MySQL 3306" dir=in action=allow protocol=TCP localport=3306
netsh advfirewall firewall add rule name="Allow Ping" dir=in action=allow protocol=icmpv4
```
**Linux (Ubuntu):**
```
sudo ufw allow 3306/tcp
```

### 5. Pastikan user remote sudah ada
Buka phpMyAdmin > tab **SQL**, jalankan:
```sql
SELECT user, host FROM mysql.user WHERE user = 'webuser';
```
Harus muncul `webuser | %`. Kalau tidak ada, import ulang `db_kampus.sql`.

---

## BAGIAN 2 - VM 1 (WEB)

### 1. Install & jalankan XAMPP
- Install XAMPP di VM 1, lalu **Start Apache** di Control Panel.
- Pastikan ekstensi PDO MySQL aktif (default sudah aktif di XAMPP).

### 2. Taruh file web
1. Buat folder: `C:\xampp\htdocs\kampus\` (Linux: `/opt/lampp/htdocs/kampus/`)
2. Copy 4 file dari folder `web/` ke dalamnya: `index.php`, `aksi.php`, `config.php`, `style.css`.

### 3. Edit IP database di `config.php`
```php
const DB_HOST = '192.168.56.20';   // <-- ganti dengan IP VM DATABASE kamu
```
User, password, dan nama database sudah cocok dengan file SQL:
| Item | Nilai |
|---|---|
| Database | `db_kampus` |
| User | `webuser` |
| Password | `webpass123` |

### 4. (Opsional) Tes koneksi ke port MySQL dari VM Web
PowerShell:
```
Test-NetConnection 192.168.56.20 -Port 3306
```
Harus **TcpTestSucceeded : True**.

### 5. Buka webnya
- Dari VM Web: `http://localhost/kampus/`
- Dari laptop host (browser biasa): `http://192.168.56.10/kampus/`
- Kalau mau akses dari host dan Windows Firewall VM Web menghalangi:
  ```
  netsh advfirewall firewall add rule name="HTTP 80" dir=in action=allow protocol=TCP localport=80
  ```

Kalau berhasil, kamu akan lihat tabel data mahasiswa, bisa **Tambah, Edit, Hapus, dan Cari**.

---

## Troubleshooting

| Masalah | Penyebab / solusi |
|---|---|
| `SQLSTATE[HY000] [2002] Connection timed out` | Firewall VM Database belum buka 3306, atau IP di `config.php` salah. |
| `SQLSTATE[HY000] [2002] Connection refused` | MySQL di VM 2 belum di-Start, atau `bind-address` masih 127.0.0.1. |
| `SQLSTATE[HY000] [1045] Access denied for user 'webuser'` | User belum dibuat. Import ulang `db_kampus.sql` di VM 2. |
| `SQLSTATE[HY000] [1130] Host ... is not allowed to connect` | User dibuat dengan host `localhost` saja. Pastikan `'webuser'@'%'`. |
| `Unknown database 'db_kampus'` | File SQL belum di-import. |
| `could not find driver` | Aktifkan `extension=pdo_mysql` di `php.ini` lalu restart Apache. |
| Ping antar VM gagal | Cek adapter host-only terpasang di kedua VM dan IP satu subnet. |
| Web tidak bisa dibuka dari host | Cek IP host-only VM Web dan firewall port 80. |

## Tips buat laporan / demo
- Screenshot: `ipconfig` kedua VM, hasil ping, tabel `mahasiswa` di phpMyAdmin VM 2, dan tampilan web di VM 1.
- Tunjukkan bahwa data baru yang ditambah lewat web langsung muncul di phpMyAdmin VM Database (bukti kedua VM benar-benar terhubung).
- Untuk keamanan, di file SQL ganti `'webuser'@'%'` jadi `'webuser'@'192.168.56.10'` (hanya VM Web yang boleh konek).
