package com.LearningPlatformApplication.enrollment;

import com.LearningPlatformApplication.course.Course;
import com.LearningPlatformApplication.course.CourseRepository;
import com.LearningPlatformApplication.enrollment.dto.EnrollmentDTO;
import com.LearningPlatformApplication.user.User;
import com.LearningPlatformApplication.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EnrollmentService {

    private final EnrollmentRepository enrollmentRepository;
    private final UserRepository userRepository;
    private final CourseRepository courseRepository;

    public UUID getValidUserId(UUID requestedUserId, String email) {
        // 1. If valid requestedUserId exists in PostgreSQL
        if (requestedUserId != null && userRepository.existsById(requestedUserId)) {
            return requestedUserId;
        }

        // 2. If email is provided, find user by email
        if (email != null && !email.isBlank()) {
            Optional<User> userByEmail = userRepository.findByEmail(email.trim());
            if (userByEmail.isPresent()) {
                return userByEmail.get().getId();
            }
            // Create user for this email if not in DB yet
            User newUser = User.builder()
                    .email(email.trim())
                    .passwordHash("password123")
                    .fullName(email.split("@")[0])
                    .role("STUDENT")
                    .build();
            return userRepository.save(newUser).getId();
        }

        // 3. Fallback to first user in database
        return userRepository.findAll().stream()
                .findFirst()
                .map(User::getId)
                .orElseGet(() -> {
                    User demoUser = User.builder()
                            .email("student@gauravlearn.com")
                            .passwordHash("password123")
                            .fullName("Demo Student")
                            .role("STUDENT")
                            .build();
                    return userRepository.save(demoUser).getId();
                });
    }

    public Enrollment enrollStudent(UUID studentId, String email, UUID courseId) {
        UUID validStudentId = getValidUserId(studentId, email);
        return enrollmentRepository.findByStudentIdAndCourseId(validStudentId, courseId)
                .orElseGet(() -> enrollmentRepository.save(Enrollment.builder()
                        .studentId(validStudentId)
                        .courseId(courseId)
                        .build()));
    }

    public List<Enrollment> getStudentEnrollments(UUID studentId, String email) {
        UUID validStudentId = getValidUserId(studentId, email);
        return enrollmentRepository.findByStudentId(validStudentId);
    }

    public List<EnrollmentDTO> getAllEnrollmentsDTO() {
        return enrollmentRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<EnrollmentDTO> getCourseEnrollmentsDTO(UUID courseId) {
        return enrollmentRepository.findByCourseId(courseId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public void removeEnrollment(UUID id) {
        enrollmentRepository.deleteById(id);
    }

    private EnrollmentDTO toDTO(Enrollment e) {
        Optional<User> uOpt = userRepository.findById(e.getStudentId());
        Optional<Course> cOpt = courseRepository.findById(e.getCourseId());

        return EnrollmentDTO.builder()
                .id(e.getId())
                .studentId(e.getStudentId())
                .studentName(uOpt.map(User::getFullName).orElse("Student User"))
                .studentEmail(uOpt.map(User::getEmail).orElse("student@gauravlearn.com"))
                .courseId(e.getCourseId())
                .courseTitle(cOpt.map(Course::getTitle).orElse("System Architecture Masterclass"))
                .enrolledAt(e.getEnrolledAt())
                .build();
    }
}
