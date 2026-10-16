<?php

declare(strict_types=1);

/*
 * Conexión reutilizable a MySQL/MariaDB mediante PDO.
 * Las credenciales se cargan desde database.local.php,
 * que debe permanecer fuera de GitHub.
 */

$configFile = __DIR__ . '/database.local.php';

if (!is_file($configFile)) {
    throw new RuntimeException('La configuración local de la base de datos no está disponible.');
}

$config = require $configFile;

$host = $config['host'];
$port = $config['port'];
$dbname = $config['dbname'];
$username = $config['username'];
$password = $config['password'];

$dsn = "mysql:host={$host};port={$port};dbname={$dbname};charset=utf8mb4";

$pdo = new PDO($dsn, $username, $password, [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
]);

return $pdo;
