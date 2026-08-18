package com.LearningPlatformApplication.review;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;

    public List<CourseReview> getCourseReviews(UUID courseId) {
        return reviewRepository.findByCourseId(courseId);
    }

    public CourseReview addReview(UUID studentId, UUID courseId, Integer rating, String comment) {
        CourseReview review = CourseReview.builder()
                .studentId(studentId)
                .courseId(courseId)
                .rating(rating)
                .comment(comment)
                .build();
        return reviewRepository.save(review);
    }
}
