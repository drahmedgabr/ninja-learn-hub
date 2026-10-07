<?php
require __DIR__ . '/bootstrap.php';

function videoById(int $id): ?array {
    $stmt = db()->prepare('SELECT id, topic_id, title, description, youtube_id, storage_key, duration, video_order, created_at, updated_at FROM training_videos WHERE id = ?');
    $stmt->execute([$id]);
    return $stmt->fetch() ?: null;
}

$method = $_SERVER['REQUEST_METHOD'];
$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
requireAdmin();

if ($method === 'POST') {
    $data = jsonInput();
    $topicId = (int)($data['topic_id'] ?? 0);
    if (!$topicId) respond(['message' => 'Topic ID is required.'], 422);
    $check = db()->prepare('SELECT id FROM training_topics WHERE id = ?');
    $check->execute([$topicId]);
    if (!$check->fetch()) respond(['message' => 'Training topic not found.'], 404);
    $title = cleanString($data['title'] ?? '', 'title');
    $description = cleanString($data['description'] ?? '', 'description');
    $storageKey = trim((string)($data['storage_key'] ?? ''));
    $youtubeId = trim((string)($data['youtube_id'] ?? ''));
    if ($storageKey === '' && $youtubeId === '') respond(['message' => 'Wasabi object key is required.'], 422);
    $duration = trim((string)($data['duration'] ?? ''));
    $order = (int)($data['video_order'] ?? 0);
    if ($order < 1) {
        $next = db()->prepare('SELECT COALESCE(MAX(video_order), 0) + 1 FROM training_videos WHERE topic_id = ?');
        $next->execute([$topicId]);
        $order = (int)$next->fetchColumn();
    }
    $stmt = db()->prepare('INSERT INTO training_videos (topic_id, title, description, youtube_id, storage_key, duration, video_order) VALUES (?, ?, ?, ?, ?, ?, ?)');
    $stmt->execute([$topicId, $title, $description, $youtubeId ?: null, $storageKey ?: null, $duration ?: null, $order]);
    respond(['data' => videoById((int)db()->lastInsertId())], 201);
}

if ($method === 'PUT') {
    if (!$id) respond(['message' => 'Video ID is required.'], 422);
    $current = videoById($id);
    if (!$current) respond(['message' => 'Video not found.'], 404);
    $data = jsonInput();
    $title = cleanString($data['title'] ?? '', 'title');
    $description = cleanString($data['description'] ?? '', 'description');
    $storageKey = trim((string)($data['storage_key'] ?? ''));
    $youtubeId = trim((string)($data['youtube_id'] ?? $current['youtube_id'] ?? ''));
    if ($storageKey === '' && $youtubeId === '') respond(['message' => 'Wasabi object key is required.'], 422);
    $duration = trim((string)($data['duration'] ?? ''));
    $order = (int)($data['video_order'] ?? $current['video_order']);
    $stmt = db()->prepare('UPDATE training_videos SET title = ?, description = ?, youtube_id = ?, storage_key = ?, duration = ?, video_order = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
    $stmt->execute([$title, $description, $youtubeId ?: null, $storageKey ?: null, $duration ?: null, max(1, $order), $id]);
    respond(['data' => videoById($id)]);
}

if ($method === 'DELETE') {
    if (!$id) respond(['message' => 'Video ID is required.'], 422);
    $stmt = db()->prepare('DELETE FROM training_videos WHERE id = ?');
    $stmt->execute([$id]);
    if (!$stmt->rowCount()) respond(['message' => 'Video not found.'], 404);
    respond(['message' => 'Video deleted.']);
}

respond(['message' => 'Method not allowed.'], 405);
