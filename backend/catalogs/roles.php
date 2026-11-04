<?php

declare(strict_types=1);

/* Devuelve el catálogo de roles únicamente a una cuenta de Coordinación autenticada. */
require_once __DIR__ . '/../auth/_session.php';
authHandleHttp('GET');

try {
    $pdo = authDatabase();
    authRequireUser($pdo, ['coordinator']);
    authJsonResponse(200, ['items' => [
        ['value' => 'student', 'label' => 'Estudiante'],
        ['value' => 'researcher', 'label' => 'Investigador'],
        ['value' => 'evaluator', 'label' => 'Evaluador'],
        ['value' => 'coordinator', 'label' => 'Coordinador'],
    ]]);
} catch (Throwable $e) {
    error_log('Roles catalog failed.');
    authJsonResponse(500, ['message' => 'Internal server error.']);
}
