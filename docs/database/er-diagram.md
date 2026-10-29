# Database Relationship Diagram

This ER diagram shows how the core tables in the learning platform relate to one another.

```mermaid
erDiagram
    USERS ||--o{ COURSES : teaches
    USERS ||--o{ ENROLLMENTS : joins
    USERS ||--o{ PAYMENTS : pays
    USERS ||--o{ COURSE_PROGRESS : progresses
    USERS ||--o{ CERTIFICATES : receives
    USERS ||--o{ COURSE_REVIEWS : writes
    USERS ||--o{ WISHLISTS : saves
    USERS ||--o{ USER_DEVICE_SESSIONS : logs_in
    USERS ||--o{ MEDIA : uploads

    COURSES ||--o{ LESSONS : contains
    COURSES ||--o{ CHAPTERS : contains
    COURSES ||--o{ ENROLLMENTS : sold_to
    COURSES ||--o{ PAYMENTS : billed_for
    COURSES ||--o{ COURSE_PROGRESS : tracked_on
    COURSES ||--o{ CERTIFICATES : issues
    COURSES ||--o{ COURSE_REVIEWS : reviewed
    COURSES ||--o{ WISHLISTS : wished
    COURSES ||--o{ COURSE_PRICING : priced
    COURSES ||--o{ CAMPAIGN_COURSES : mapped_to
    CAMPAIGNS ||--o{ CAMPAIGN_COURSES : includes

    LESSONS ||--o{ COURSE_PROGRESS : lesson_progress
    LESSONS }o--|| CHAPTERS : belongs_to

    MEDIA ||--o{ COURSES : thumbnail
    MEDIA ||--o{ LESSONS : lesson_media
    MEDIA ||--o{ VIDEO_UPLOADS : upload_record

    USERS {
        UUID id
        VARCHAR email
        VARCHAR password_hash
        VARCHAR full_name
        VARCHAR role
        TEXT avatar_url
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }

    COURSES {
        UUID id
        VARCHAR title
        TEXT description
        UUID instructor_id
        DECIMAL price
        VARCHAR status
        VARCHAR access_type
        UUID thumbnail_media_id
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }

    CHAPTERS {
        UUID id
        UUID course_id
        VARCHAR title
        INT sequence_order
        TIMESTAMP created_at
    }

    LESSONS {
        UUID id
        UUID course_id
        UUID chapter_id
        VARCHAR title
        TEXT description
        TEXT content
        INT sequence_order
        UUID media_id
        VARCHAR lesson_type
        TEXT content_url
        TEXT video_thumbnail_url
        TEXT quiz_data
        TIMESTAMP created_at
    }

    MEDIA {
        UUID id
        VARCHAR original_filename
        TEXT object_key
        VARCHAR media_type
        VARCHAR mime_type
        BIGINT file_size
        VARCHAR status
        UUID uploaded_by
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }

    ENROLLMENTS {
        UUID id
        UUID student_id
        UUID course_id
        TIMESTAMP enrolled_at
    }

    COURSE_PRICING {
        UUID id
        UUID course_id
        DECIMAL base_price
        DECIMAL discount_price
        VARCHAR currency
    }

    CAMPAIGNS {
        UUID id
        VARCHAR name
        DECIMAL discount_percentage
        TIMESTAMP start_date
        TIMESTAMP end_date
        BOOLEAN is_active
    }

    CAMPAIGN_COURSES {
        UUID campaign_id
        UUID course_id
    }

    COUPONS {
        UUID id
        VARCHAR code
        DECIMAL discount_amount
        INT max_uses
        INT used_count
        TIMESTAMP expiration_date
    }

    PAYMENTS {
        UUID id
        UUID user_id
        UUID course_id
        DECIMAL amount
        VARCHAR razorpay_order_id
        VARCHAR razorpay_payment_id
        VARCHAR status
        TIMESTAMP created_at
    }

    COURSE_PROGRESS {
        UUID id
        UUID student_id
        UUID course_id
        UUID lesson_id
        BOOLEAN is_completed
        TIMESTAMP updated_at
    }

    CERTIFICATES {
        UUID id
        UUID student_id
        UUID course_id
        VARCHAR certificate_code
        TIMESTAMP issued_at
    }

    COURSE_REVIEWS {
        UUID id
        UUID student_id
        UUID course_id
        INT rating
        TEXT comment
        TIMESTAMP created_at
    }

    WISHLISTS {
        UUID id
        UUID student_id
        UUID course_id
        TIMESTAMP created_at
    }

    USER_DEVICE_SESSIONS {
        UUID id
        UUID user_id
        VARCHAR user_email
        VARCHAR full_name
        VARCHAR role
        VARCHAR device_type
        VARCHAR os
        VARCHAR browser
        TEXT user_agent
        VARCHAR ip_address
        VARCHAR location
        VARCHAR token_snippet
        TEXT token
        BOOLEAN is_active
        TIMESTAMP login_at
        TIMESTAMP last_active_at
    }

    VIDEO_UPLOADS {
        UUID id
        UUID media_id
        TEXT upload_id
        TEXT object_key
        TEXT file_name
        BIGINT file_size
        BIGINT chunk_size
        INT total_parts
        VARCHAR status
        VARCHAR created_by
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }
```

## Relationship summary

- USERS is the main identity node.
- COURSES is the center of content and purchase flows.
- LESSONS and CHAPTERS structure the learning content.
- ENROLLMENTS, PAYMENTS, COURSE_PROGRESS, CERTIFICATES, COURSE_REVIEWS, and WISHLISTS describe learner behavior.
- MEDIA and VIDEO_UPLOADS represent uploaded assets and storage metadata.
- CAMPAIGNS and CAMPAIGN_COURSES connect marketing offers to courses.
- USER_DEVICE_SESSIONS tracks login and device activity.

This file is ready to be pushed to GitHub and GitHub will render the Mermaid diagram automatically.
