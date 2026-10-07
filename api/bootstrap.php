<?php
declare(strict_types=1);

session_start();

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$configFile = __DIR__ . '/config.php';
if (!file_exists($configFile)) {
    http_response_code(503);
    echo json_encode(['message' => 'API is not configured. Create api/config.php from api/config.php.example.'], JSON_UNESCAPED_UNICODE);
    exit;
}

require $configFile;

function db(): PDO {
    static $pdo = null;
    if ($pdo instanceof PDO) return $pdo;
    $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4';
    $pdo = new PDO($dsn, DB_USER, DB_PASSWORD, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
    return $pdo;
}

function jsonInput(): array {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw ?: '{}', true);
    return is_array($data) ? $data : [];
}

function respond(mixed $data = null, int $status = 200): never {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function requireAdmin(): void {
    if (empty($_SESSION['ninja_admin'])) respond(['message' => 'Admin authentication required.'], 401);
}

function cleanString(mixed $value, string $field): string {
    $value = trim((string)$value);
    if ($value === '') respond(['message' => ucfirst($field) . ' is required.'], 422);
    return $value;
}
