<?php

declare(strict_types=1);

/* Conecta con MySQL en XAMPP y respeta la configuración local si ya existe. */
$config = [
    'host' => '127.0.0.1',
    'port' => 3306,
    'dbname' => 'university_research_platform',
    'username' => 'root',
    'password' => '',
];

// Las credenciales personalizadas tienen prioridad sobre los valores de desarrollo.
$localFile = __DIR__ . '/database.local.php';
if (is_file($localFile)) {
    $localConfig = require $localFile;
    if (!is_array($localConfig)) {
        throw new RuntimeException('La configuración local debe devolver un arreglo.');
    }
    $config = array_replace($config, $localConfig);
}

$host = (string) $config['host'];
$port = (int) $config['port'];
$dbname = (string) $config['dbname'];
$dsn = "mysql:host={$host};port={$port};dbname={$dbname};charset=utf8mb4";

$pdo = new PDO($dsn, (string) $config['username'], (string) $config['password'], [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false,
]);

return $pdo;
