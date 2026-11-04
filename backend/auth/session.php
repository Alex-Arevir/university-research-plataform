<?php

declare(strict_types=1);

/* Recupera el usuario actual y comprueba que su cuenta y sesión sigan vigentes. */
require_once __DIR__ . '/_session.php';
authHandleHttp('GET');

try {
    $pdo = authDatabase();
    $user = authRequireUser($pdo);
    authJsonResponse(200, ['user' => $user]);
} catch (Throwable $e) {
    error_log('Authentication session check failed.');
    authJsonResponse(500, ['message' => 'Internal server error.']);
}
