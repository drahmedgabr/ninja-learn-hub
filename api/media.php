<?php
require __DIR__ . '/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') respond(['message' => 'Method not allowed.'], 405);
$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
if (!$id) respond(['message' => 'Video ID is required.'], 422);

$stmt = db()->prepare('SELECT storage_key FROM training_videos WHERE id = ?');
$stmt->execute([$id]);
$storageKey = trim((string)($stmt->fetchColumn() ?: ''));
if ($storageKey === '') respond(['message' => 'This video is not stored on Wasabi.'], 404);

foreach (['WASABI_BUCKET','WASABI_ACCESS_KEY','WASABI_SECRET_KEY','WASABI_REGION','WASABI_ENDPOINT'] as $constant) {
    if (!defined($constant)) respond(['message' => 'Wasabi storage is not configured.'], 503);
}

$autoload = __DIR__ . '/../vendor/autoload.php';
if (!file_exists($autoload)) respond(['message' => 'Wasabi SDK is not installed. Run composer install on the server.'], 503);
require_once $autoload;

try {
    $client = new Aws\S3\S3Client([
        'version' => 'latest',
        'region' => WASABI_REGION,
        'endpoint' => WASABI_ENDPOINT,
        'use_path_style_endpoint' => true,
        'credentials' => ['key' => WASABI_ACCESS_KEY, 'secret' => WASABI_SECRET_KEY],
    ]);
    $command = $client->getCommand('GetObject', [
        'Bucket' => WASABI_BUCKET,
        'Key' => ltrim($storageKey, '/'),
        'ResponseContentType' => 'video/mp4',
        'ResponseContentDisposition' => 'inline',
    ]);
    $ttl = defined('WASABI_URL_TTL_SECONDS') ? max(300, (int)WASABI_URL_TTL_SECONDS) : 14400;
    $request = $client->createPresignedRequest($command, '+' . $ttl . ' seconds');
    respond(['data' => ['url' => (string)$request->getUri(), 'expires_in' => $ttl]]);
} catch (Throwable $e) {
    error_log('Ninja Learn Wasabi signing error: ' . $e->getMessage());
    respond(['message' => 'Unable to prepare the video right now.'], 502);
}
