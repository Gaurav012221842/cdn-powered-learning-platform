# CDN-Powered Learning Platform & Microservices Architecture

A state-of-the-art, high-performance E-Learning Cloud Platform built with **Spring Boot 3**, **React 19**, **Apache Kafka**, **Redis**, **PostgreSQL**, **Cloudflare R2 Storage**, and **Razorpay Payment Gateway**.

---

## 🚀 Key Platform Features

### 🎥 1. Cloudflare R2 & CDN Media Streaming
- **Direct Multipart R2 Storage Uploads**: Upload videos, high-resolution images, PDFs, reels, and audio directly to Cloudflare R2 bucket with zero backend latency.
- **Short-Lived Presigned Token Security**: Media URLs expire automatically after 60 seconds to prevent link sharing and unauthorized downloads.
- **Anti-Theft Floating Watermark Overlay**: Dynamic overlay featuring student email and IP address floating across video playback to prevent screen recording and content theft.

### 📚 2. Admin Course & Curriculum Builder (`/admin/course/create`)
- Dynamic Chapter and Module hierarchy management.
- Multi-format Lesson Types dropdown:
  - 🎥 **VIDEO**: Supports custom video upload + custom video thumbnail poster.
  - 📄 **PDF**: Supports embedded PDF reader.
  - 🖼️ **IMAGE**: Supports architectural diagram viewer.
  - 📝 **QUIZ**: Interactive question & option builder with automatic student grading.

### 💳 3. Razorpay Payment Gateway Integration
- Official Razorpay JavaScript Checkout Window (`checkout.js`) with support for:
  - 💳 **Credit / Debit Cards**
  - 📱 **UPI QR & App Selectors** (Google Pay, PhonePe, Paytm)
  - 🏛️ **Netbanking** (HDFC, SBI, ICICI, Axis)
  - 👛 **Paytm Wallets & Pay Later**
- HMAC-SHA256 signature verification in Spring Boot (`POST /api/v1/payments/verify`).
- Instant automated PostgreSQL enrollment registration (`POST /api/v1/enrollments`).

### 🔒 4. Access Control & Student Management (`/admin/enrollments`)
- **Strict Course Locking**: Non-enrolled students see `🔒 Complete Razorpay Payment to Unlock` on lessons.
- **Free Preview**: Chapter 1, Lesson 1 features an `👁️ Free Preview` badge.
- **Admin Revocation Portal**: One-click student access revocation (`DELETE /api/v1/enrollments/{id}`) with real-time database cache eviction.

### ⚙️ 5. Asynchronous Kafka Video Worker (`video-worker`)
- Background microservice listening to Kafka topic `media-transcoding-events`.
- Automatically executes FFmpeg multi-bitrate HLS segmentation (`.m3u8` & `.ts`) and uploads segments back to Cloudflare R2.
- Exposes health status endpoint at `http://localhost:8081/api/v1/worker/status`.

---

## 🛠️ Microservices & Workspace Structure

```text
CDN-Powered Learning Platform/
├── LearningPlatformApplication/      # Core Spring Boot 3 REST API (Port 8080)
├── video-worker/                     # FFmpeg HLS Transcoding Microservice (Port 8081)
├── learningapplicationfrontend/     # Modern React 19 Frontend Web Application (Port 3000)
├── infrastructure/                   # Docker Compose, Kafka, Redis & Prometheus Configs
└── docs/                             # System Architecture, Database Schema & API Docs
```

---

## ⚡ Quick Start

### 1. Run via Docker Compose
```bash
docker-compose up -d
```

### 2. Service Endpoints
| Component | Service | Port / URL |
| :--- | :--- | :--- |
| **Frontend Web App** | React 19 SPA | `http://localhost:3000` |
| **Core Backend API** | Spring Boot 3 | `http://localhost:8080` |
| **Video Worker** | Spring Boot Microservice | `http://localhost:8081` |
| **PostgreSQL Database**| PostgreSQL 18 | `localhost:5433` / `5432` |
| **Redis Cache** | Redis 7 | `localhost:6379` |
| **Kafka Event Broker** | Apache Kafka | `localhost:9092` |

---

## 📖 System Documentation Links

- 📐 [System Architecture & Design](file:///Users/gauravkumar/Music/CDN-Powered%20Learning%20Platform/docs/architecture/system-design.md)
- 🗄️ [Database Schema & Migration Design](file:///Users/gauravkumar/Music/CDN-Powered%20Learning%20Platform/docs/database/database-design.md)
- 🔌 [Complete REST API Specification](file:///Users/gauravkumar/Music/CDN-Powered%20Learning%20Platform/docs/api/api-specification.md)
- 📊 [Architectural Mermaid Diagrams](file:///Users/gauravkumar/Music/CDN-Powered%20Learning%20Platform/docs/diagrams/system-architecture.md)
