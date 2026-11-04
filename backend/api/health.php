<?php

declare(strict_types=1);

/* Comprueba la conexión y las columnas que necesita la autenticación, sin modificar datos. */
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

try {
    $pdo = require __DIR__ . '/../config/database.php';
    $pdo->query('SELECT 1')->fetchColumn();
} catch (Throwable $e) {
    error_log('Database health check failed.');
    http_response_code(503);
    echo json_encode([
        'status' => 'error',
        'backend' => 'available',
        'database' => 'unavailable',
        'code' => 'DATABASE_UNAVAILABLE',
        'message' => 'Revisa MySQL y la conexión de backend/config/database.php o database.local.php.',
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    $pdo->query('SELECT id, name, username, password_hash, role, status FROM users LIMIT 0');
    $pdo->query('SELECT id, user_id, token_hash, created_at, last_activity_at, expires_at, revoked_at FROM user_sessions LIMIT 0');
} catch (Throwable $e) {
    error_log('Authentication schema health check failed.');
    http_response_code(503);
    echo json_encode([
        'status' => 'error',
        'backend' => 'available',
        'database' => 'connected',
        'authentication' => 'unavailable',
        'code' => 'AUTH_SCHEMA_UNAVAILABLE',
        'message' => 'La conexión funciona, pero faltan tablas o columnas de users o user_sessions.',
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

echo json_encode([
    'status' => 'ok',
    'backend' => 'available',
    'database' => 'connected',
    'authentication' => 'ready',
], JSON_UNESCAPED_UNICODE);
