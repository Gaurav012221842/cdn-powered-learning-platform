package com.LearningPlatformApplication.progress;

import com.LearningPlatformApplication.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/progress")
@RequiredArgsConstructor
public class ProgressController {

    private final ProgressService progressService;

    @GetMapping("/student/{studentId}/course/{courseId}")
    public ResponseEntity<ApiResponse<List<CourseProgress>>> getProgress(
            @PathVariable String studentId,
            @PathVariable String courseId,
            @RequestParam(required = false) String email
    ) {
        return ResponseEntity.ok(ApiResponse.success("Progress retrieved", progressService.getProgress(studentId, courseId, email)));
    }

    @PostMapping("/mark-completed")
    public ResponseEntity<ApiResponse<CourseProgress>> markCompleted(
            @RequestParam String studentId,
            @RequestParam String courseId,
            @RequestParam String lessonId,
            @RequestParam(required = false) String email
    ) {
        return ResponseEntity.ok(ApiResponse.success("Lesson marked completed", progressService.toggleLessonProgress(studentId, courseId, lessonId, true, email)));
    }

    @PostMapping("/toggle")
    public ResponseEntity<ApiResponse<CourseProgress>> toggleProgress(
            @RequestParam String studentId,
            @RequestParam String courseId,
            @RequestParam String lessonId,
            @RequestParam(required = false, defaultValue = "true") Boolean completed,
            @RequestParam(required = false) String email
    ) {
        return ResponseEntity.ok(ApiResponse.success("Progress updated", progressService.toggleLessonProgress(studentId, courseId, lessonId, completed, email)));
    }
}
