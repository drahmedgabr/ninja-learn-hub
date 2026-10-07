<?php
require __DIR__ . '/bootstrap.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    respond(['authenticated' => !empty($_SESSION['ninja_admin'])]);
}

if ($method === 'POST') {
    $data = jsonInput();
    $password = (string)($data['password'] ?? '');
    if ($password === '' || !password_verify($password, ADMIN_PASSWORD_HASH)) {
        respond(['message' => 'Invalid admin password.'], 401);
    }
    session_regenerate_id(true);
    $_SESSION['ninja_admin'] = true;
    respond(['authenticated' => true]);
}

if ($method === 'DELETE') {
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'], $params['secure'], $params['httponly']);
    }
    session_destroy();
    respond(['authenticated' => false]);
}

respond(['message' => 'Method not allowed.'], 405);
