<?php

declare(strict_types=1);

/* Valida las credenciales y abre una sesión con el rol registrado en MySQL. */
require_once __DIR__ . '/_session.php';
authHandleHttp('POST');

$input = json_decode(file_get_contents('php://input'), true);
if (!is_array($input) || !isset($input['username'], $input['password']) ||
    !is_string($input['username']) || !is_string($input['password']) ||
    trim($input['username']) === '' || $input['password'] === '') {
    authJsonResponse(400, ['message' => 'Username and password are required.']);
}

$pdo = null;
try {
    $pdo = authDatabase();
    $stmt = $pdo->prepare(
        'SELECT id, name, username, password_hash, role, status
         FROM users WHERE username = :username LIMIT 1'
    );
    $stmt->execute(['username' => trim($input['username'])]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$user || !password_verify($input['password'], $user['password_hash'])) {
        authJsonResponse(401, ['message' => 'Invalid credentials.']);
    }
    if ($user['status'] !== 'active' || !in_array($user['role'], authRoles(), true)) {
        authJsonResponse(403, ['message' => 'Account is inactive or has no permitted role.']);
    }

    authStartSession();
    $pdo->beginTransaction();
    // Si había otra sesión en esta cookie, se revoca antes de sustituirla.
    if (isset($_SESSION['db_session_id'], $_SESSION['user_id'])) {
        $old = $pdo->prepare(
            'UPDATE user_sessions SET revoked_at = NOW()
             WHERE id = :id AND user_id = :user_id AND revoked_at IS NULL'
        );
        $old->execute(['id' => $_SESSION['db_session_id'], 'user_id' => $_SESSION['user_id']]);
    }
    $_SESSION = [];
    if (!session_regenerate_id(true)) {
        throw new RuntimeException('Session could not be regenerated.');
    }
    $insert = $pdo->prepare(
        'INSERT INTO user_sessions (user_id, token_hash, created_at, last_activity_at, expires_at)
         VALUES (:user_id, :token_hash, NOW(), NOW(), DATE_ADD(NOW(), INTERVAL 30 MINUTE))'
    );
    $insert->execute(['user_id' => (int) $user['id'], 'token_hash' => hash('sha256', session_id())]);
    $sessionId = (int) $pdo->lastInsertId();
    $pdo->commit();
    $_SESSION['user_id'] = (int) $user['id'];
    $_SESSION['db_session_id'] = $sessionId;
    $_SESSION['last_activity'] = time();
    authJsonResponse(200, ['message' => 'Login successful.', 'user' => authPublicUser($user)]);
} catch (Throwable $e) {
    if ($pdo instanceof PDO && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    authEndSession();
    error_log('Authentication login failed: '.$e->getMessage());
    authJsonResponse(500, ['message' => 'Internal server error.']);
}
