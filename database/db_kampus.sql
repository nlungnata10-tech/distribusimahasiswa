-- =====================================================
--  Database untuk Tugas VirtualBox (VM Database)
--  Import lewat phpMyAdmin atau command line MySQL
-- =====================================================

CREATE DATABASE IF NOT EXISTS db_kampus
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_general_ci;

USE db_kampus;

-- -----------------------------------------------------
--  Tabel mahasiswa
-- -----------------------------------------------------
DROP TABLE IF EXISTS mahasiswa;

CREATE TABLE mahasiswa (
    id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
    nim        VARCHAR(20)  NOT NULL,
    nama       VARCHAR(100) NOT NULL,
    prodi      VARCHAR(60)  NOT NULL,
    angkatan   SMALLINT     NOT NULL,
    email      VARCHAR(100) NOT NULL,
    created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_nim (nim)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------------
--  Data contoh
-- -----------------------------------------------------
INSERT INTO mahasiswa (nim, nama, prodi, angkatan, email) VALUES
('2024010001', 'Andi Pratama',      'Teknik Informatika',       2024, 'andi.pratama@email.com'),
('2024010002', 'Siti Nurhaliza',    'Sistem Informasi',         2024, 'siti.nurhaliza@email.com'),
('2023020015', 'Budi Santoso',      'Teknik Komputer',          2023, 'budi.santoso@email.com'),
('2023010021', 'Dewi Lestari',      'Teknik Informatika',       2023, 'dewi.lestari@email.com'),
('2022030007', 'Rizky Maulana',     'Manajemen Informatika',    2022, 'rizky.maulana@email.com'),
('2022040012', 'Putri Anggraini',   'Desain Komunikasi Visual', 2022, 'putri.anggraini@email.com'),
('2024020033', 'Fajar Ramadhan',    'Sistem Informasi',         2024, 'fajar.ramadhan@email.com');

-- -----------------------------------------------------
--  User khusus untuk akses dari VM Web (remote)
--  '%' = boleh dari IP mana saja (mudah untuk tugas).
--  Lebih aman: ganti '%' dengan IP VM Web, misal '192.168.56.10'
-- -----------------------------------------------------
CREATE USER IF NOT EXISTS 'webuser'@'%' IDENTIFIED BY 'webpass123';
GRANT SELECT, INSERT, UPDATE, DELETE ON db_kampus.* TO 'webuser'@'%';
FLUSH PRIVILEGES;
