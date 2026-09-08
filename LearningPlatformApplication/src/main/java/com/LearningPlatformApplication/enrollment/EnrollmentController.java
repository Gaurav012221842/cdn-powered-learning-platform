package com.LearningPlatformApplication.enrollment;

import com.LearningPlatformApplication.common.ApiResponse;
import com.LearningPlatformApplication.course.Course;
import com.LearningPlatformApplication.course.CourseRepository;
import com.LearningPlatformApplication.enrollment.dto.EnrollmentDTO;
import com.LearningPlatformApplication.security.JwtService;
import com.LearningPlatformApplication.user.User;
import com.LearningPlatformApplication.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/enrollments")
@RequiredArgsConstructor
public class EnrollmentController {

    private final EnrollmentService enrollmentService;
    private final JwtService jwtService;
    private final UserRepository userRepository;

    @PostMapping
    public ResponseEntity<ApiResponse<Enrollment>> enroll(
            @RequestParam(required = false) String studentId,
            @RequestParam(required = false) String studentEmail,
            @RequestParam(required = false) String courseId
    ) {
        UUID sId = parseUUID(studentId);
        UUID cId = resolveCourseUUID(courseId);
        return ResponseEntity.ok(ApiResponse.success("Student enrolled successfully", enrollmentService.enrollStudent(sId, studentEmail, cId)));
    }

    @PostMapping("/admin/grant")
    public ResponseEntity<ApiResponse<Enrollment>> adminGrantEnrollment(
            @RequestParam(required = false) String studentId,
            @RequestParam(required = false) String studentEmail,
            @RequestParam(required = false) String courseId
    ) {
        UUID sId = parseUUID(studentId);
        UUID cId = resolveCourseUUID(courseId);
        return ResponseEntity.ok(ApiResponse.success("Course access granted", enrollmentService.enrollStudent(sId, studentEmail, cId)));
    }

    @GetMapping("/student/{studentId}")
    public ResponseEntity<ApiResponse<List<Enrollment>>> getStudentEnrollments(
            @PathVariable(required = false) String studentId,
            @RequestParam(required = false) String email
    ) {
        UUID id = null;
        try {
            if (studentId != null && !studentId.isBlank() && !studentId.equals("undefined") && !studentId.equals("null")) {
                id = UUID.fromString(studentId);
            }
        } catch (Exception ignored) {}
        return ResponseEntity.ok(ApiResponse.success("Enrollments retrieved", enrollmentService.getStudentEnrollments(id, email)));
    }

    @GetMapping("/all")
    public ResponseEntity<ApiResponse<List<EnrollmentDTO>>> getAllEnrollments() {
        return ResponseEntity.ok(ApiResponse.success("All enrollments retrieved", enrollmentService.getAllEnrollmentsDTO()));
    }

    @GetMapping("/course/{courseId}")
    public ResponseEntity<ApiResponse<List<EnrollmentDTO>>> getCourseEnrollments(@PathVariable UUID courseId) {
        return ResponseEntity.ok(ApiResponse.success("Course enrollments retrieved", enrollmentService.getCourseEnrollmentsDTO(courseId)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> removeEnrollment(
            @PathVariable UUID id,
            @RequestHeader(value = "Authorization", required = false) String authHeader
    ) {
        if (!isAdmin(authHeader)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("Forbidden: Only administrators can revoke student enrollments."));
        }
        enrollmentService.removeEnrollment(id);
        return ResponseEntity.ok(ApiResponse.success("Student enrollment revoked successfully", null));
    }

    private final CourseRepository courseRepository;

    private UUID parseUUID(String str) {
        if (str == null || str.isBlank() || str.equals("undefined") || str.equals("null")) return null;
        try {
            return UUID.fromString(str);
        } catch (Exception e) {
            return null;
        }
    }

    private UUID resolveCourseUUID(String str) {
        if (str == null || str.isBlank() || str.equals("undefined") || str.equals("null")) {
            return courseRepository.findAll().stream().findFirst().map(Course::getId).orElseGet(UUID::randomUUID);
        }
        try {
            return UUID.fromString(str);
        } catch (Exception e) {
            return courseRepository.findAll().stream().findFirst().map(Course::getId).orElseGet(UUID::randomUUID);
        }
    }

    private boolean isAdmin(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return false;
        }
        try {
            String token = authHeader.substring(7);
            String email = jwtService.extractUsername(token);
            if (email == null || email.isBlank()) return false;
            Optional<User> userOpt = userRepository.findByEmail(email);
            return userOpt.isPresent() && "ADMIN".equalsIgnoreCase(userOpt.get().getRole());
        } catch (Exception e) {
            return false;
        }
    }
}
