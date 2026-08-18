package com.LearningPlatformApplication.lesson;

import com.LearningPlatformApplication.common.ApiResponse;
import com.LearningPlatformApplication.lesson.dto.CreateLessonRequest;
import com.LearningPlatformApplication.lesson.dto.LessonResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/lessons")
@RequiredArgsConstructor
public class LessonController {

    private final LessonService lessonService;

    @GetMapping("/course/{courseId}")
    public ResponseEntity<ApiResponse<List<LessonResponse>>> getLessonsByCourse(@PathVariable UUID courseId) {
        return ResponseEntity.ok(ApiResponse.success("Lessons retrieved", lessonService.getLessonsByCourse(courseId)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<LessonResponse>> createLesson(@RequestBody CreateLessonRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Lesson created", lessonService.createLesson(request)));
    }
}
