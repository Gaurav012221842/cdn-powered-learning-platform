package com.LearningPlatformApplication.progress;

import com.LearningPlatformApplication.user.User;
import com.LearningPlatformApplication.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.ZonedDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProgressService {

    private final ProgressRepository progressRepository;
    private final UserRepository userRepository;
    private final StringRedisTemplate stringRedisTemplate;

    @Cacheable(value = "student_progress", key = "(#studentIdStr ?: '') + '_' + (#courseIdStr ?: '') + '_' + (#email ?: '')")
    public List<CourseProgress> getProgress(String studentIdStr, String courseIdStr, String email) {
        UUID studentId = resolveStudentId(studentIdStr, email);
        UUID courseId = parseUuid(courseIdStr);

        if (studentId == null || courseId == null) {
            return Collections.emptyList();
        }

        return progressRepository.findByStudentIdAndCourseId(studentId, courseId);
    }

    /**
     * Get set of marked completed lesson IDs directly from Redis RAM
     */
    public Set<String> getMarkedLessonIdsFromRedis(String studentIdStr, String courseIdStr, String email) {
        UUID studentId = resolveStudentId(studentIdStr, email);
        UUID courseId = parseUuid(courseIdStr);

        if (studentId == null || courseId == null) {
            return Collections.emptySet();
        }

        String redisKey = buildRedisProgressKey(studentId, courseId);

        try {
            Set<String> markedIds = stringRedisTemplate.opsForSet().members(redisKey);
            if (markedIds != null && !markedIds.isEmpty()) {
                log.info("Fetched {} marked lessons directly from Redis RAM key={}", markedIds.size(), redisKey);
                return markedIds;
            }

            // Sync from Database into Redis if cache missed
            List<CourseProgress> progressList = progressRepository.findByStudentIdAndCourseId(studentId, courseId);
            for (CourseProgress cp : progressList) {
                if (Boolean.TRUE.equals(cp.getIsCompleted()) && cp.getLessonId() != null) {
                    stringRedisTemplate.opsForSet().add(redisKey, cp.getLessonId().toString());
                }
            }
            stringRedisTemplate.expire(redisKey, 2, TimeUnit.HOURS);
            return stringRedisTemplate.opsForSet().members(redisKey);
        } catch (Exception e) {
            log.warn("Redis progress fetch fallback: {}", e.getMessage());
            return Collections.emptySet();
        }
    }

    /**
     * Check if specific lesson is marked completed via Redis SISMEMBER
     */
    public boolean isLessonMarkedCompleted(String studentIdStr, String courseIdStr, String lessonIdStr, String email) {
        UUID studentId = resolveStudentId(studentIdStr, email);
        UUID courseId = parseUuid(courseIdStr);
        UUID lessonId = parseUuid(lessonIdStr);

        if (studentId == null || courseId == null || lessonId == null) return false;

        String redisKey = buildRedisProgressKey(studentId, courseId);
        try {
            Boolean isMember = stringRedisTemplate.opsForSet().isMember(redisKey, lessonId.toString());
            if (Boolean.TRUE.equals(isMember)) return true;
        } catch (Exception e) {
            log.warn("Redis SISMEMBER check fallback: {}", e.getMessage());
        }

        return progressRepository.findByStudentIdAndLessonId(studentId, lessonId)
                .map(cp -> Boolean.TRUE.equals(cp.getIsCompleted()))
                .orElse(false);
    }

    @CacheEvict(value = "student_progress", allEntries = true)
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
        boolean markCompleted = completed != null ? completed : true;

        CourseProgress progress = progressRepository.findByStudentIdAndLessonId(finalStudentId, finalLessonId)
                .orElseGet(() -> CourseProgress.builder()
                        .studentId(finalStudentId)
                        .courseId(finalCourseId)
                        .lessonId(finalLessonId)
                        .build());

        progress.setIsCompleted(markCompleted);
        progress.setUpdatedAt(ZonedDateTime.now());
        CourseProgress saved = progressRepository.save(progress);

        // Update Redis Set for marked completed lessons
        String redisKey = buildRedisProgressKey(finalStudentId, finalCourseId);
        try {
            if (markCompleted) {
                stringRedisTemplate.opsForSet().add(redisKey, finalLessonId.toString());
                log.info("Redis SADD: Marked lesson {} as COMPLETED in Redis key={}", finalLessonId, redisKey);
            } else {
                stringRedisTemplate.opsForSet().remove(redisKey, finalLessonId.toString());
                log.info("Redis SREM: Unmarked lesson {} in Redis key={}", finalLessonId, redisKey);
            }
            stringRedisTemplate.expire(redisKey, 2, TimeUnit.HOURS);
        } catch (Exception e) {
            log.warn("Redis progress update warning: {}", e.getMessage());
        }

        return saved;
    }

    private String buildRedisProgressKey(UUID studentId, UUID courseId) {
        return "progress:marked:" + studentId + ":" + courseId;
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
