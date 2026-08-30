package com.LearningPlatformApplication.course;

import com.LearningPlatformApplication.common.ApiResponse;
import com.LearningPlatformApplication.course.dto.CourseResponse;
import com.LearningPlatformApplication.course.dto.CreateCourseRequest;
import com.LearningPlatformApplication.course.dto.UpdateCourseRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/courses")
@RequiredArgsConstructor
public class CourseController {

    private final CourseService courseService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<CourseResponse>>> getAllCourses() {
        return ResponseEntity.ok(ApiResponse.success("Courses retrieved", courseService.getAllCourses()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CourseResponse>> getCourseById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success("Course retrieved", courseService.getCourseById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CourseResponse>> createCourse(@RequestBody CreateCourseRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Course created", courseService.createCourse(request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CourseResponse>> updateCourse(@PathVariable UUID id, @RequestBody UpdateCourseRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Course updated", courseService.updateCourse(id, request)));
    }

    @PostMapping("/{id}/quiz/submit")
    public ResponseEntity<ApiResponse<com.LearningPlatformApplication.course.dto.QuizEvaluationResponse>> submitQuiz(
            @PathVariable UUID id,
            @RequestBody com.LearningPlatformApplication.course.dto.QuizSubmissionRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Quiz evaluated successfully", courseService.evaluateQuiz(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteCourse(@PathVariable UUID id) {
        courseService.deleteCourse(id);
        return ResponseEntity.ok(ApiResponse.success("Course deleted successfully", null));
    }
}
