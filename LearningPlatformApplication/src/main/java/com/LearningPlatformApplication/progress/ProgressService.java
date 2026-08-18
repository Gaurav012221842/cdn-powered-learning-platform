package com.LearningPlatformApplication.progress;

import com.LearningPlatformApplication.user.User;
import com.LearningPlatformApplication.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.ZonedDateTime;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProgressService {

    private final ProgressRepository progressRepository;
    private final UserRepository userRepository;

    public List<CourseProgress> getProgress(String studentIdStr, String courseIdStr, String email) {
        UUID studentId = resolveStudentId(studentIdStr, email);
        UUID courseId = parseUuid(courseIdStr);

        if (studentId == null || courseId == null) {
            return Collections.emptyList();
        }

        return progressRepository.findByStudentIdAndCourseId(studentId, courseId);
    }

    public CourseProgress toggleLessonProgress(String studentIdStr, String courseIdStr, String lessonIdStr, Boolean completed, String email) {
        UUID studentId = resolveStudentId(studentIdStr, email);
        UUID courseId = parseUuid(courseIdStr);
        UUID lessonId = parseUuid(lessonIdStr);

        if (studentId == null) {
            studentId = UUID.nameUUIDFromBytes("default-student".getBytes());
        }
        if (courseId == null) {
            courseId = UUID.nameUUIDFromBytes((courseIdStr != null ? courseIdStr : "default-course").getBytes());
        }
        if (lessonId == null) {
            lessonId = UUID.nameUUIDFromBytes((lessonIdStr != null ? lessonIdStr : "default-lesson").getBytes());
        }

        UUID finalStudentId = studentId;
        UUID finalLessonId = lessonId;
        UUID finalCourseId = courseId;

        CourseProgress progress = progressRepository.findByStudentIdAndLessonId(finalStudentId, finalLessonId)
                .orElseGet(() -> CourseProgress.builder()
                        .studentId(finalStudentId)
                        .courseId(finalCourseId)
                        .lessonId(finalLessonId)
                        .build());

        progress.setIsCompleted(completed != null ? completed : true);
        progress.setUpdatedAt(ZonedDateTime.now());
        return progressRepository.save(progress);
    }

    private UUID resolveStudentId(String studentIdStr, String email) {
        UUID id = parseUuid(studentIdStr);
        if (id != null) return id;

        if (email != null && !email.isBlank() && !email.equals("null") && !email.equals("undefined")) {
            return userRepository.findByEmail(email)
                    .map(User::getId)
                    .orElseGet(() -> UUID.nameUUIDFromBytes(email.getBytes()));
        }

        if (studentIdStr != null && !studentIdStr.isBlank() && !studentIdStr.equals("null") && !studentIdStr.equals("undefined")) {
            return UUID.nameUUIDFromBytes(studentIdStr.getBytes());
        }

        return null;
    }

    private UUID parseUuid(String str) {
        if (str == null || str.isBlank() || str.equals("undefined") || str.equals("null") || str.equals("current")) {
            return null;
        }
        try {
            return UUID.fromString(str);
        } catch (Exception e) {
            return UUID.nameUUIDFromBytes(str.getBytes());
        }
    }
}
