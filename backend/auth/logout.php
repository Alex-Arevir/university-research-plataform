<?php

declare(strict_types=1);

/* Revoca la sesión en MySQL y elimina la cookie de autenticación del navegador. */
require_once __DIR__ . '/_session.php';
authHandleHttp('POST');

try {
    authStartSession();
    if (isset($_SESSION['user_id'], $_SESSION['db_session_id'])) {
        $pdo = authDatabase();
        $stmt = $pdo->prepare(
            'UPDATE user_sessions SET revoked_at = NOW()
             WHERE id = :session_id AND user_id = :user_id AND revoked_at IS NULL'
        );
        $stmt->execute(['session_id' => $_SESSION['db_session_id'], 'user_id' => $_SESSION['user_id']]);
    }
    authEndSession();
    authJsonResponse(200, ['message' => 'Logout successful.']);
} catch (Throwable $e) {
    // Se mantiene la sesión local para permitir reintentar y no afirmar un cierre que falló.
    error_log('Authentication logout failed.');
    authJsonResponse(500, ['message' => 'Internal server error.']);
}
