# Kafka Topics Specification

## 1. `media-transcoding-events`
- **Partitions**: 3
- **Replication Factor**: 2
- **Producer**: `LearningPlatformApplication` (Media Service)
- **Consumer**: `video-worker`
- **Payload**:
  ```json
  {
    "mediaId": "uuid",
    "objectKey": "raw/video-123.mp4",
    "targetQualities": ["1080p", "720p", "480p"],
    "timestamp": "2026-08-16T12:00:00Z"
  }
  ```

## 2. `course-enrollment-events`
- **Partitions**: 3
- **Consumer**: Notification & Certificate Service
- **Payload**: Student ID, Course ID, Payment Reference.
