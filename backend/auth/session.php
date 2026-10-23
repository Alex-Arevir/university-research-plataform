<?php
declare(strict_types=1);

require_once __DIR__ . '/_session.php';
require_once __DIR__ . '/../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    header('Allow: GET');
    authJsonResponse(405, ['message' => 'Method not allowed.']);
}

authStartSession();

$userId = $_SESSION['user_id'] ?? null;
$dbSessionId = $_SESSION['db_session_id'] ?? null;

if (!$userId || !$dbSessionId) {
    authJsonResponse(401, ['message' => 'No active session.']);
}

try {
    $stmt = $pdo->prepare(
        'SELECT
            s.id AS session_id,
            s.user_id,
            s.token_hash,
            s.last_activity_at,
            s.expires_at,
            s.revoked_at,
            u.id,
            u.name,
            u.username,
            u.role,
            u.status
         FROM user_sessions s
         INNER JOIN users u ON u.id = s.user_id
         WHERE s.id = :session_id
           AND s.user_id = :user_id
         LIMIT 1'
    );

    $stmt->execute([
        'session_id' => $dbSessionId,
        'user_id' => $userId,
    ]);

    $record = $stmt->fetch(PDO::FETCH_ASSOC);

    $sessionHash = hash('sha256', session_id());

    if (
        !$record ||
        $record['revoked_at'] !== null ||
        !hash_equals($record['token_hash'], $sessionHash) ||
        $record['status'] !== 'active'
    ) {
        if ($record && $record['revoked_at'] === null) {
            $revoke = $pdo->prepare(
                'UPDATE user_sessions
                 SET revoked_at = NOW()
                 WHERE id = :id'
            );
            $revoke->execute(['id' => $dbSessionId]);
        }

        $_SESSION = [];
        session_destroy();

        authJsonResponse(401, ['message' => 'No active session.']);
    }

    $activity = $pdo->prepare(
        'SELECT
            last_activity_at <= DATE_SUB(NOW(), INTERVAL 30 MINUTE)
                AS is_inactive,
            expires_at <= NOW() AS is_expired
         FROM user_sessions
         WHERE id = :id'
    );
    $activity->execute(['id' => $dbSessionId]);
    $times = $activity->fetch(PDO::FETCH_ASSOC);

    if (
        !$times ||
        (int) $times['is_inactive'] === 1 ||
        (int) $times['is_expired'] === 1
    ) {
        $revoke = $pdo->prepare(
            'UPDATE user_sessions
             SET revoked_at = NOW()
             WHERE id = :id AND revoked_at IS NULL'
        );
        $revoke->execute(['id' => $dbSessionId]);

        $_SESSION = [];
        session_destroy();

        authJsonResponse(401, ['message' => 'Session expired.']);
    }

    $update = $pdo->prepare(
        'UPDATE user_sessions
         SET last_activity_at = NOW(),
             expires_at = DATE_ADD(NOW(), INTERVAL 30 MINUTE)
         WHERE id = :id'
    );
    $update->execute(['id' => $dbSessionId]);

    $_SESSION['last_activity'] = time();

    authJsonResponse(200, [
        'user' => [
            'id' => (int) $record['id'],
            'name' => $record['name'],
            'username' => $record['username'],
            'role' => $record['role'],
            'status' => $record['status'],
        ],
    ]);
} catch (Throwable $e) {
    error_log('Authentication session check failed.');
    authJsonResponse(500, ['message' => 'Internal server error.']);
}
