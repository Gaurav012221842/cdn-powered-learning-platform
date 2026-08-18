# Complete REST API Specification

Base Endpoint: `http://localhost:8080/api/v1`

---

## 🔐 1. Authentication Endpoints (`/api/v1/auth`)

### `POST /api/v1/auth/register`
Registers a new user (Student or Admin).
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "Password123!",
    "fullName": "Gaurav Student",
    "role": "STUDENT"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "message": "User registered successfully",
    "data": {
      "id": "a1b2c3d4-5678-90ef-1234-567890abcdef",
      "token": "eyJhbGciOiJIUzI1NiJ9...",
      "email": "user@example.com",
      "fullName": "Gaurav Student",
      "role": "STUDENT",
      "avatarUrl": null
    }
  }
  ```

### `POST /api/v1/auth/login`
Authenticates a user and generates JWT.
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "Password123!"
  }
  ```
- **Response `200 OK`**: `AuthResponse` containing JWT token and user profile details.

---

## 📚 2. Course & Curriculum Endpoints (`/api/v1/courses`)

### `GET /api/v1/courses` (Public)
Retrieves all published courses for Explore Courses catalog.

### `GET /api/v1/courses/{id}` (Public)
Retrieves course details along with chapters and lesson curriculum.

### `POST /api/v1/courses` (Admin)
Creates a new course with multi-chapter curriculum.
- **Request Body**:
  ```json
  {
    "title": "Full-Stack System Architecture & Distributed Systems",
    "description": "Master microservices, Redis caching, Kafka streaming, and Cloudflare CDN.",
    "price": 49.99,
    "thumbnailUrl": "https://pub-xxx.r2.dev/thumbnail.jpg",
    "chapters": [
      {
        "title": "Chapter 1: System Design",
        "sequenceOrder": 1,
        "lessons": [
          {
            "title": "Lesson 1: Intro to Kafka",
            "lessonType": "VIDEO",
            "contentUrl": "https://pub-xxx.r2.dev/video.mp4",
            "videoThumbnailUrl": "https://pub-xxx.r2.dev/thumb.jpg",
            "sequenceOrder": 1
          },
          {
            "title": "Lesson 2: System Architecture Quiz",
            "lessonType": "QUIZ",
            "quizData": "{\"questions\":[{\"question\":\"What is Kafka?\",\"options\":[\"Queue\",\"DB\"],\"correctIndex\":0}]}",
            "sequenceOrder": 2
          }
        ]
      }
    ]
  }
  ```

---

## 📁 3. Media Upload & Presigned Storage Endpoints (`/api/v1/media`)

### `POST /api/v1/media/presigned-url`
Generates a signed Cloudflare R2 upload URL for direct client multipart uploads.

### `POST /api/v1/media/upload-direct`
Direct multipart upload fallback to Cloudflare R2 bucket.

### `GET /api/v1/media/signed-url`
Generates a 60-second presigned streaming URL for secure media playback.

---

## 💳 4. Razorpay Payment Endpoints (`/api/v1/payments`)

### `POST /api/v1/payments/initiate`
Initiates a Razorpay payment order.
- **Query Params**: `userId`, `userEmail`, `courseId`, `amount`
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "data": {
      "razorpayOrderId": "order_xxx",
      "amount": 49.99,
      "status": "PENDING"
    }
  }
  ```

### `POST /api/v1/payments/verify`
Verifies Razorpay HMAC SHA256 payment signature and auto-completes enrollment.
- **Query Params**: `razorpayOrderId`, `razorpayPaymentId`, `signature`, `userId`, `userEmail`, `courseId`, `amount`

---

## 🎓 5. Student Enrollment Endpoints (`/api/v1/enrollments`)

### `POST /api/v1/enrollments`
Enrolls a student in a course.
- **Query Params**: `studentId`, `studentEmail`, `courseId`

### `GET /api/v1/enrollments/student/{studentId}`
Checks if a student is enrolled in courses.

### `GET /api/v1/enrollments/all` (Admin)
Retrieves all student enrollments with student name, email, and course title.

### `DELETE /api/v1/enrollments/{id}` (Admin)
Revokes/deletes a student's course access from PostgreSQL.

---

## ⚙️ 6. Video Worker Endpoint (`video-worker`)

### `GET http://localhost:8081/api/v1/worker/status`
Exposes video transcoding worker health and Kafka topic telemetry.
