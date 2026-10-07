-- Run this once on an existing Ninja Learn database.
ALTER TABLE training_videos
  MODIFY youtube_id VARCHAR(32) NULL,
  ADD COLUMN storage_key VARCHAR(500) NULL AFTER youtube_id;

CREATE INDEX idx_videos_storage_key ON training_videos (storage_key);
