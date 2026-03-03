-- Add source_url for deduplication (Pinterest media URL)
ALTER TABLE media_files ADD COLUMN source_url TEXT;

-- Unique index: same user + same source URL = duplicate
CREATE UNIQUE INDEX idx_media_files_user_source_url
    ON media_files(user_id, source_url)
    WHERE source_url IS NOT NULL;
