<?php
require __DIR__ . '/bootstrap.php';

function topicWithVideos(int $id): ?array {
    $stmt = db()->prepare('SELECT id, title, description, created_at, updated_at FROM training_topics WHERE id = ?');
    $stmt->execute([$id]);
    $topic = $stmt->fetch();
    if (!$topic) return null;
    $videos = db()->prepare('SELECT id, topic_id, title, description, youtube_id, duration, video_order, created_at, updated_at FROM training_videos WHERE topic_id = ? ORDER BY video_order ASC, id ASC');
    $videos->execute([$id]);
    $topic['videos'] = $videos->fetchAll();
    return $topic;
}

$method = $_SERVER['REQUEST_METHOD'];
$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

if ($method === 'GET') {
    $isAdminRead = isset($_GET['admin']) && $_GET['admin'] === '1';
    if ($isAdminRead) requireAdmin();

    if ($id) {
        $topic = topicWithVideos($id, $isAdminRead);
        if (!$topic) respond(['message' => 'Training topic not found.'], 404);
        respond(['data' => $topic]);
    }
    $rows = db()->query('SELECT id, title, description, created_at, updated_at FROM training_topics ORDER BY created_at DESC, id DESC')->fetchAll();
    if ($rows) {
        $ids = array_column($rows, 'id');
        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        $videoFields = $isAdminRead
            ? 'id, topic_id, title, description, youtube_id, storage_key, duration, video_order'
            : 'id, topic_id, title, description, youtube_id, duration, video_order';
        $stmt = db()->prepare("SELECT $videoFields FROM training_videos WHERE topic_id IN ($placeholders) ORDER BY video_order ASC, id ASC");
        $stmt->execute($ids);
        $grouped = [];
        foreach ($stmt->fetchAll() as $video) $grouped[$video['topic_id']][] = $video;
        foreach ($rows as &$row) $row['videos'] = $grouped[$row['id']] ?? [];
    }
    respond(['data' => $rows]);
}

requireAdmin();

if ($method === 'POST') {
    $data = jsonInput();
    $title = cleanString($data['title'] ?? '', 'title');
    $description = cleanString($data['description'] ?? '', 'description');
    $stmt = db()->prepare('INSERT INTO training_topics (title, description) VALUES (?, ?)');
    $stmt->execute([$title, $description]);
    respond(['data' => topicWithVideos((int)db()->lastInsertId(), true)], 201);
}

if ($method === 'PUT') {
    if (!$id) respond(['message' => 'Topic ID is required.'], 422);
    $data = jsonInput();
    $title = cleanString($data['title'] ?? '', 'title');
    $description = cleanString($data['description'] ?? '', 'description');
    $stmt = db()->prepare('UPDATE training_topics SET title = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
    $stmt->execute([$title, $description, $id]);
    if (!$stmt->rowCount() && !topicWithVideos($id)) respond(['message' => 'Training topic not found.'], 404);
    respond(['data' => topicWithVideos($id, true)]);
}

if ($method === 'DELETE') {
    if (!$id) respond(['message' => 'Topic ID is required.'], 422);
    $stmt = db()->prepare('DELETE FROM training_topics WHERE id = ?');
    $stmt->execute([$id]);
    if (!$stmt->rowCount()) respond(['message' => 'Training topic not found.'], 404);
    respond(['message' => 'Training topic deleted.']);
}

respond(['message' => 'Method not allowed.'], 405);
