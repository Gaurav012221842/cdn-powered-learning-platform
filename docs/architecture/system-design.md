# Comprehensive System Design & Microservices Architecture

## 🏗️ Architecture Blueprint

The platform implements a cloud-native microservices architecture designed for high availability, low latency, and zero-downtime video streaming.

```text
[ React 19 Frontend Web App (Port 3000) ]
        │
        ├── Direct Media Upload ───────► [ Cloudflare R2 Storage / CDN ]
        │                                          ▲
        ├── REST API (JWT Auth)                    │ (Upload Transcoded HLS)
        ▼                                          │
[ LearningPlatformApplication (Port 8080) ] ───────┤
        │                                          │
        ├── Kafka Event ("media-transcoding-events")│
        ▼                                          │
[ video-worker Microservice (Port 8081) ] ─────────┘
        │
        ├── (FFmpeg Segmentation & Multi-bitrate HLS)
        │
┌───────┴───────┐
│ PostgreSQL 18 │ (Managed via Flyway Migrations V1-V16)
└───────────────┘
```

---

## ⚡ Technical Highlights

### 1. Cloudflare R2 & CDN Media Delivery
- **Direct S3 Multipart Uploads**: Upload assets directly to R2 bucket using AWS S3 Java SDK v2 / React Direct Uploader.
- **Short-Lived Signed Presigned Tokens**: Video presigned links expire after 60 seconds to defeat unauthorized link copying.
- **Anti-Theft Floating Watermark Overlay**: Dynamic React canvas floating email & IP overlay during video playback.

### 2. Microservices Responsibilities
- **`LearningPlatformApplication`**: Main API gateway, JWT Security, Course Management, Razorpay Payment verification, PostgreSQL & Redis operations.
- **`video-worker`**: Dedicated background transcoding engine consuming Kafka events for multi-bitrate HLS segmentation (`index.m3u8`).
- **`learningapplicationfrontend`**: Responsive SPA with Admin Curriculum Builder, Razorpay Checkout Modal, and Access Control Locking.

### 3. Payment Gateway & Enrollment Security
- HMAC-SHA256 signature verification in Spring Boot using Razorpay Secret Key.
- Live database enrollment lookup with student identity fallback to ensure zero data mismatches.
