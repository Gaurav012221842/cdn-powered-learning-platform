package com.LearningPlatformApplication.review;

import com.LearningPlatformApplication.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @GetMapping("/course/{courseId}")
    public ResponseEntity<ApiResponse<List<CourseReview>>> getReviews(@PathVariable UUID courseId) {
        return ResponseEntity.ok(ApiResponse.success("Reviews retrieved", reviewService.getCourseReviews(courseId)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CourseReview>> addReview(
            @RequestParam UUID studentId,
            @RequestParam UUID courseId,
            @RequestParam Integer rating,
            @RequestParam(required = false) String comment
    ) {
        return ResponseEntity.ok(ApiResponse.success("Review submitted", reviewService.addReview(studentId, courseId, rating, comment)));
    }
}
