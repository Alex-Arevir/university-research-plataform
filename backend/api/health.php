<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

try {
    require_once __DIR__ . '/../config/database.php';

    $statement = $pdo->query('SELECT 1');
    $result = $statement->fetchColumn();

    if ((int) $result !== 1) {
        throw new RuntimeException('Database check failed.');
    }

    http_response_code(200);

    echo json_encode([
        'status'   => 'ok',
        'backend'  => 'available',
        'database' => 'connected',
    ]);

} catch (Throwable $exception) {
    error_log('Health check failed.');

    http_response_code(503);

    echo json_encode([
        'status'   => 'error',
        'backend'  => 'available',
        'database' => 'unavailable',
        'message'  => 'Database connection could not be verified.',
    ]);
}
