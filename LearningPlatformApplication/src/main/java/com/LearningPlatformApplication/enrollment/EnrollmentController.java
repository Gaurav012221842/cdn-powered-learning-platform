package com.LearningPlatformApplication.enrollment;

import com.LearningPlatformApplication.common.ApiResponse;
import com.LearningPlatformApplication.enrollment.dto.EnrollmentDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/enrollments")
@RequiredArgsConstructor
public class EnrollmentController {

    private final EnrollmentService enrollmentService;

    @PostMapping
    public ResponseEntity<ApiResponse<Enrollment>> enroll(
            @RequestParam(required = false) UUID studentId,
            @RequestParam(required = false) String studentEmail,
            @RequestParam UUID courseId
    ) {
        return ResponseEntity.ok(ApiResponse.success("Student enrolled", enrollmentService.enrollStudent(studentId, studentEmail, courseId)));
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
    public ResponseEntity<ApiResponse<Void>> removeEnrollment(@PathVariable UUID id) {
        enrollmentService.removeEnrollment(id);
        return ResponseEntity.ok(ApiResponse.success("Student enrollment revoked successfully", null));
    }
}
