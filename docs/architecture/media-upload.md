# Media Upload Flow Architecture

1. Client requests presigned upload URL from backend.
2. Backend returns signed Cloudflare R2 PUT URL.
3. Client uploads directly to R2 bucket.
4. Backend triggers Kafka `media-transcoding-events` for async processing.
