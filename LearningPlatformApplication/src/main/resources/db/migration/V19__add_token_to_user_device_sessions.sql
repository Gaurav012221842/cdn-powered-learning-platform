ALTER TABLE user_device_sessions ADD COLUMN IF NOT EXISTS token TEXT;
CREATE INDEX IF NOT EXISTS idx_user_device_sessions_token_snippet ON user_device_sessions(token_snippet);
