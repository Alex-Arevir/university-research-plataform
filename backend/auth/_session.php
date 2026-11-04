<?php

declare(strict_types=1);

/* Comparte la configuración HTTP, la cookie y la validación de sesiones y roles. */

function authJsonResponse(int $httpCode, array $data): void
{
    http_response_code($httpCode);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

// Permite solamente los orígenes del frontend configurados para desarrollo.
function authHandleHttp(string $method): void
{
    header('Cache-Control: no-store');
    header('Content-Type: application/json; charset=utf-8');
    header('Vary: Origin');

    $configured = getenv('APP_ALLOWED_ORIGINS');
    $origins = $configured !== false && trim($configured) !== ''
        ? array_map('trim', explode(',', $configured))
        : [
            'http://localhost:8100', 'http://localhost:8101',
            'http://127.0.0.1:8100', 'http://127.0.0.1:8101',
        ];

    $secure = !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off';
    $sameOrigin = ($secure ? 'https://' : 'http://') . ($_SERVER['HTTP_HOST'] ?? '');
    $origins[] = $sameOrigin;
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';

    if ($origin !== '') {
        if (!in_array($origin, $origins, true)) {
            authJsonResponse(403, ['message' => 'Origin is not allowed.']);
        }
        header('Access-Control-Allow-Origin: ' . $origin);
        header('Access-Control-Allow-Credentials: true');
    }

    if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
        header('Access-Control-Allow-Methods: ' . $method . ', OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type');
        http_response_code(204);
        exit;
    }

    if (($_SERVER['REQUEST_METHOD'] ?? '') !== $method) {
        header('Allow: ' . $method . ', OPTIONS');
        authJsonResponse(405, ['message' => 'Method not allowed.']);
    }

    // Los POST de autenticación deben venir de un cliente JSON, no de un formulario externo.
    if ($method === 'POST') {
        $contentType = strtolower(trim(explode(';', $_SERVER['CONTENT_TYPE'] ?? '')[0]));
        if ($contentType !== 'application/json') {
            authJsonResponse(415, ['message' => 'Content-Type must be application/json.']);
        }
    }
}

// La conexión se carga dentro del try de cada endpoint para responder errores en JSON.
function authDatabase(): PDO
{
    return require __DIR__ . '/../config/database.php';
}

function authStartSession(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }

    ini_set('session.use_strict_mode', '1');
    ini_set('session.use_only_cookies', '1');
    ini_set('session.gc_maxlifetime', '1800');
    $secure = !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off';

    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'secure' => $secure,
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    if (!session_start()) {
        throw new RuntimeException('Session storage is unavailable.');
    }
}

function authEndSession(): void
{
    if (session_status() !== PHP_SESSION_ACTIVE) {
        return;
    }
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', [
            'expires' => time() - 42000,
            'path' => $params['path'],
            'domain' => $params['domain'],
            'secure' => $params['secure'],
            'httponly' => $params['httponly'],
            'samesite' => $params['samesite'] ?? 'Lax',
        ]);
    }
    session_destroy();
}

function authRoles(): array
{
    return ['student', 'researcher', 'evaluator', 'coordinator'];
}

function authPublicUser(array $user): array
{
    return [
        'id' => (int) $user['id'],
        'name' => $user['name'],
        'username' => $user['username'],
        'role' => $user['role'],
        'status' => $user['status'],
    ];
}

// Comprueba la cuenta y la sesión en la base de datos, nunca un rol recibido del cliente.
function authRequireUser(PDO $pdo, array $allowedRoles = []): array
{
    authStartSession();
    $userId = $_SESSION['user_id'] ?? null;
    $dbSessionId = $_SESSION['db_session_id'] ?? null;
    if (!$userId || !$dbSessionId) {
        authEndSession();
        authJsonResponse(401, ['message' => 'No active session.']);
    }

    $stmt = $pdo->prepare(
        'SELECT s.token_hash, s.revoked_at,
                s.last_activity_at <= DATE_SUB(NOW(), INTERVAL 30 MINUTE) AS is_inactive,
                s.expires_at <= NOW() AS is_expired,
                u.id, u.name, u.username, u.role, u.status
         FROM user_sessions s
         INNER JOIN users u ON u.id = s.user_id
         WHERE s.id = :session_id AND s.user_id = :user_id
         LIMIT 1'
    );
    $stmt->execute(['session_id' => $dbSessionId, 'user_id' => $userId]);
    $record = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$record || $record['revoked_at'] !== null ||
        !hash_equals($record['token_hash'], hash('sha256', session_id())) ||
        $record['status'] !== 'active' ||
        !in_array($record['role'], authRoles(), true) ||
        (int) $record['is_inactive'] === 1 || (int) $record['is_expired'] === 1) {
        if ($record && $record['revoked_at'] === null) {
            $revoke = $pdo->prepare('UPDATE user_sessions SET revoked_at = NOW() WHERE id = :id');
            $revoke->execute(['id' => $dbSessionId]);
        }
        authEndSession();
        authJsonResponse(401, ['message' => 'Session expired or unavailable.']);
    }

    if ($allowedRoles !== [] && !in_array($record['role'], $allowedRoles, true)) {
        authJsonResponse(403, ['message' => 'Access denied for this role.']);
    }

    $update = $pdo->prepare(
        'UPDATE user_sessions SET last_activity_at = NOW(),
         expires_at = DATE_ADD(NOW(), INTERVAL 30 MINUTE) WHERE id = :id'
    );
    $update->execute(['id' => $dbSessionId]);
    $_SESSION['last_activity'] = time();
    return authPublicUser($record);
}
