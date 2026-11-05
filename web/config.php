<?php
// ============================================
// KONFIGURASI KONEKSI DATABASE
// Ganti DB_HOST dengan IP VM Database kamu
// ============================================
const DB_HOST = '192.168.56.20';   // <-- IP VM DATABASE
const DB_PORT = '3306';
const DB_NAME = 'db_kampus';
const DB_USER = 'webuser';
const DB_PASS = 'webpass123';

function db(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        $dsn = 'mysql:host=' . DB_HOST . ';port=' . DB_PORT . ';dbname=' . DB_NAME . ';charset=utf8mb4';
        $pdo = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_TIMEOUT            => 5,
        ]);
    }
    return $pdo;
}

function e(?string $s): string {
    return htmlspecialchars($s ?? '', ENT_QUOTES, 'UTF-8');
}
