CREATE TABLE IF NOT EXISTS user_device_sessions (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(50) NOT NULL,
    device_type VARCHAR(50) DEFAULT 'DESKTOP',
    os VARCHAR(100),
    browser VARCHAR(100),
    user_agent TEXT,
    ip_address VARCHAR(100),
    location VARCHAR(150),
    token_snippet VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    login_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_device_sessions_user_id ON user_device_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_device_sessions_user_email ON user_device_sessions(user_email);
CREATE INDEX IF NOT EXISTS idx_user_device_sessions_login_at ON user_device_sessions(login_at);
