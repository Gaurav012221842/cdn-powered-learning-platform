# Infrastructure & Deployment Architecture Guide

This document outlines the containerized deployment and infrastructure stack for the CDN-Powered Learning Platform.

---

## 🐳 1. Docker & Containerization Stack

The platform runs 8 isolated containers orchestrated via Docker Compose:

| Container Name | Service Description | Port Mapping | Image / Base |
| :--- | :--- | :--- | :--- |
| `frontend-app` | React 19 SPA served via Nginx | `3000:80` | `nginx:alpine` |
| `backend-app` | Spring Boot 3 Core REST API | `8080:8080` | `eclipse-temurin:17-jre` |
| `video-worker` | FFmpeg HLS Transcoding Engine | `8081:8081` | `eclipse-temurin:17-jre` + FFmpeg |
| `learning-platform-db` | PostgreSQL 18 Relational DB | `5433:5432` | `postgres:15-alpine` |
| `learning-platform-redis` | Redis Distributed Cache | `6379:6379` | `redis:7-alpine` |
| `kafka` | Apache Kafka Event Broker | `9092:9092` | `confluentinc/cp-kafka:7.4.0` |
| `zookeeper` | Kafka Cluster Manager | `2181:2181` | `confluentinc/cp-zookeeper:7.4.0` |
| `prometheus` / `grafana` | Telemetry & Metrics | `9090` / `3001` | `prom/prometheus` & `grafana` |

---

## ☁️ 2. Cloudflare R2 Edge Storage Strategy

- **Bucket Name**: `learning-platform`
- **CDN Endpoint**: `https://pub-7bfd051a435d43a480e08281cb9a1b86.r2.dev`
- **S3 API Compatibility**: Cloudflare R2 S3 API (`https://<account-id>.r2.cloudflarestorage.com`)
- **Direct Upload Flow**:
  1. Frontend requests signed presigned URL via `POST /api/v1/media/presigned-url`.
  2. Client uploads file directly to Cloudflare R2 with zero backend compute load.
- **Short-Lived Presigned Streaming Tokens**: Presigned playback URLs automatically expire after 60 seconds.

---

## 📊 3. Monitoring & Telemetry Stack

- **Spring Boot Actuator**: Exposes `/actuator/prometheus` metrics.
- **Prometheus Collector**: Scrapes JVM memory, thread contention, HTTP request latency, and Redis connection pool stats every 15 seconds.
- **Grafana Dashboard**: Accessible at `http://localhost:3001` (login: `admin` / `admin`).

---

## ⚡ 4. Launch Commands

### Development Local Launch:
```bash
docker-compose up -d
```

### Production Deployment Launch:
```bash
docker-compose -f infrastructure/docker/docker-compose.prod.yml up -d --build
```
