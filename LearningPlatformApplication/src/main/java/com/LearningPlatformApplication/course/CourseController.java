package com.LearningPlatformApplication.course;

import com.LearningPlatformApplication.common.ApiResponse;
import com.LearningPlatformApplication.course.dto.CourseResponse;
import com.LearningPlatformApplication.course.dto.CreateCourseRequest;
import com.LearningPlatformApplication.course.dto.UpdateCourseRequest;
import com.LearningPlatformApplication.security.JwtService;
import com.LearningPlatformApplication.user.User;
import com.LearningPlatformApplication.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/courses")
@RequiredArgsConstructor
public class CourseController {

    private final CourseService courseService;
    private final JwtService jwtService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<CourseResponse>>> getAllCourses() {
        return ResponseEntity.ok(ApiResponse.success("Courses retrieved", courseService.getAllCourses()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CourseResponse>> getCourseById(
            @PathVariable UUID id,
            @RequestParam(required = false) String studentId,
            @RequestParam(required = false) String email,
            @RequestHeader(value = "Authorization", required = false) String authHeader
    ) {
        UUID sId = parseUUID(studentId);
        boolean isAdmin = checkIsAdmin(authHeader);
        return ResponseEntity.ok(ApiResponse.success("Course retrieved", courseService.getCourseById(id, sId, email, isAdmin)));
    }

    private boolean checkIsAdmin(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) return false;
        try {
            String token = authHeader.substring(7);
            String userEmail = jwtService.extractUsername(token);
            if (userEmail == null || userEmail.isBlank()) return false;
            Optional<User> uOpt = userRepository.findByEmail(userEmail);
            return uOpt.isPresent() && "ADMIN".equalsIgnoreCase(uOpt.get().getRole());
        } catch (Exception e) {
            return false;
        }
    }

    private UUID parseUUID(String str) {
        if (str == null || str.isBlank() || str.equals("undefined") || str.equals("null")) return null;
        try {
            return UUID.fromString(str);
        } catch (Exception e) {
            return null;
        }
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
