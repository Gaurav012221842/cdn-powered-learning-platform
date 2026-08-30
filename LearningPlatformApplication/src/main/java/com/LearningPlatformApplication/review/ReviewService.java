package com.LearningPlatformApplication.review;

import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;

    @Cacheable(value = "course_reviews", key = "#courseId")
    public List<CourseReview> getCourseReviews(UUID courseId) {
        return reviewRepository.findByCourseId(courseId);
    }

    @Cacheable(value = "course_rating_summary", key = "#courseId")
    public Map<String, Object> getCourseRatingSummary(UUID courseId) {
        List<CourseReview> reviews = reviewRepository.findByCourseId(courseId);
        double averageRating = reviews.stream()
                .mapToInt(r -> r.getRating() != null ? r.getRating() : 0)
                .average()
                .orElse(0.0);

        Map<String, Object> summary = new HashMap<>();
        summary.put("courseId", courseId);
        summary.put("totalReviews", reviews.size());
        summary.put("averageRating", Math.round(averageRating * 10.0) / 10.0);
        return summary;
    }

    @CacheEvict(value = {"course_reviews", "course_rating_summary"}, allEntries = true)
    public CourseReview addReview(UUID studentId, UUID courseId, Integer rating, String comment) {
        CourseReview review = CourseReview.builder()
                .studentId(studentId)
                .courseId(courseId)
                .rating(rating != null ? rating : 5)
                .comment(comment)
                .build();
        return reviewRepository.save(review);
    }

    @CacheEvict(value = {"course_reviews", "course_rating_summary"}, allEntries = true)
    public void deleteReview(UUID reviewId) {
        reviewRepository.deleteById(reviewId);
    }
}
