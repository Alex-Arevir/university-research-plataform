<?php
declare(strict_types=1);

require_once __DIR__ . '/_session.php';
require_once __DIR__ . '/../config/database.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Allow: POST');
    authJsonResponse(405, ['message' => 'Method not allowed.']);
}

$input = json_decode(file_get_contents('php://input'), true);

if (
    !is_array($input) ||
    !isset($input['username'], $input['password']) ||
    !is_string($input['username']) ||
    !is_string($input['password']) ||
    $input['username'] === '' ||
    $input['password'] === ''
) {
    authJsonResponse(400, ['message' => 'Username and password are required.']);
}

$username = $input['username'];
$password = $input['password'];

try {
    $stmt = $pdo->prepare(
        'SELECT id, name, username, password_hash, role, status
         FROM users
         WHERE username = :username
         LIMIT 1'
    );
    $stmt->execute(['username' => $username]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user || !password_verify($password, $user['password_hash'])) {
        authJsonResponse(401, ['message' => 'Invalid credentials.']);
    }

    if ($user['status'] !== 'active') {
        authJsonResponse(403, ['message' => 'Account is inactive.']);
    }

    authStartSession();
    session_regenerate_id(true);

    $now = time();
    $_SESSION['user_id'] = (int) $user['id'];
    $_SESSION['last_activity'] = $now;

    $tokenHash = hash('sha256', session_id());

    $insert = $pdo->prepare(
        'INSERT INTO user_sessions
         (user_id, token_hash, created_at, last_activity_at, expires_at)
         VALUES (:user_id, :token_hash, NOW(), NOW(),
                 DATE_ADD(NOW(), INTERVAL 30 MINUTE))'
    );
    $insert->execute([
        'user_id' => (int) $user['id'],
        'token_hash' => $tokenHash,
    ]);

    $_SESSION['db_session_id'] = (int) $pdo->lastInsertId();

    authJsonResponse(200, [
        'message' => 'Login successful.',
        'user' => authPublicUser($user),
    ]);
} catch (Throwable $e) {
    error_log('Authentication login failed.');
    authJsonResponse(500, ['message' => 'Internal server error.']);
}
