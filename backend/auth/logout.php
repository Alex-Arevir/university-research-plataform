<?php
declare(strict_types=1);

require_once __DIR__ . '/_session.php';
require_once __DIR__ . '/../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Allow: POST');
    authJsonResponse(405, ['message' => 'Method not allowed.']);
}

authStartSession();

$userId = $_SESSION['user_id'] ?? null;
$dbSessionId = $_SESSION['db_session_id'] ?? null;

try {
    if ($userId && $dbSessionId) {
        $stmt = $pdo->prepare(
            'UPDATE user_sessions
             SET revoked_at = NOW()
             WHERE id = :session_id
               AND user_id = :user_id
               AND revoked_at IS NULL'
        );

        $stmt->execute([
            'session_id' => $dbSessionId,
            'user_id' => $userId,
        ]);
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

    authJsonResponse(200, [
        'message' => 'Logout successful.',
    ]);
} catch (Throwable $e) {
    $_SESSION = [];
    session_destroy();

    error_log('Authentication logout failed.');
    authJsonResponse(500, ['message' => 'Internal server error.']);
}
