-- Create video_uploads table with TEXT types for long R2 multipart tokens
CREATE TABLE IF NOT EXISTS video_uploads (
    id UUID PRIMARY KEY,
    media_id UUID,
    upload_id TEXT NOT NULL,
    object_key TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    chunk_size BIGINT NOT NULL,
    total_parts INT NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Safely alter column types to TEXT if table was pre-created with VARCHAR(255)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'video_uploads' AND column_name = 'upload_id' AND data_type = 'character varying'
    ) THEN
        ALTER TABLE video_uploads ALTER COLUMN upload_id TYPE TEXT;
        ALTER TABLE video_uploads ALTER COLUMN object_key TYPE TEXT;
        ALTER TABLE video_uploads ALTER COLUMN file_name TYPE TEXT;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'media' AND column_name = 'object_key' AND data_type = 'character varying'
    ) THEN
        ALTER TABLE media ALTER COLUMN object_key TYPE TEXT;
        ALTER TABLE media ALTER COLUMN original_filename TYPE TEXT;
    END IF;
END $$;
