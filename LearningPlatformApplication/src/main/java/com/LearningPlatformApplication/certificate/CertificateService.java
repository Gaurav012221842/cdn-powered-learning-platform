package com.LearningPlatformApplication.certificate;

import com.LearningPlatformApplication.course.CourseRepository;
import com.LearningPlatformApplication.enrollment.EnrollmentService;
import com.LearningPlatformApplication.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.ZonedDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class CertificateService {

    private final CertificateRepository certificateRepository;
    private final EnrollmentService enrollmentService;
    private final UserRepository userRepository;
    private final CourseRepository courseRepository;

    @Transactional
    public Certificate generateCertificate(UUID studentId, String email, UUID courseId) {
        UUID validStudentId = enrollmentService.getValidUserId(studentId, email);

        // Check if certificate already issued for this course
        List<Certificate> existingList = certificateRepository.findByStudentIdAndCourseIdOrderByIssuedAtAsc(validStudentId, courseId);
        if (existingList != null && !existingList.isEmpty()) {
            // Clean up any extra duplicates from prior test calls
            if (existingList.size() > 1) {
                for (int i = 1; i < existingList.size(); i++) {
                    try {
                        certificateRepository.delete(existingList.get(i));
                    } catch (Exception ignored) {}
                }
            }
            return existingList.get(0);
        }

        String code = "CERT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        Certificate certificate = Certificate.builder()
                .id(UUID.randomUUID())
                .studentId(validStudentId)
                .courseId(courseId)
                .certificateCode(code)
                .issuedAt(ZonedDateTime.now())
                .build();

        Certificate saved = certificateRepository.save(certificate);
        log.info("Issued certificate {} for student {} on course {}", code, validStudentId, courseId);
        return saved;
    }

    @Transactional
    public List<Certificate> getStudentCertificates(UUID studentId, String email) {
        UUID validStudentId = enrollmentService.getValidUserId(studentId, email);
        List<Certificate> all = certificateRepository.findByStudentIdOrderByIssuedAtDesc(validStudentId);

        // Deduplicate in-memory by courseId (keep only 1 certificate per completed course)
        Map<UUID, Certificate> uniqueByCourse = new LinkedHashMap<>();
        List<Certificate> duplicatesToDelete = new ArrayList<>();

        for (Certificate c : all) {
            if (c.getCourseId() != null) {
                if (!uniqueByCourse.containsKey(c.getCourseId())) {
                    uniqueByCourse.put(c.getCourseId(), c);
                } else {
                    duplicatesToDelete.add(c);
                }
            }
        }

        // Clean up redundant duplicate records
        if (!duplicatesToDelete.isEmpty()) {
            try {
                certificateRepository.deleteAll(duplicatesToDelete);
            } catch (Exception e) {
                log.warn("Could not delete duplicate certificates: {}", e.getMessage());
            }
        }

        return new ArrayList<>(uniqueByCourse.values());
    }

    public Optional<Certificate> verifyCertificate(String certificateCode) {
        if (certificateCode == null || certificateCode.isBlank()) {
            return Optional.empty();
        }
        return certificateRepository.findByCertificateCode(certificateCode.trim().toUpperCase());
    }

    public Optional<Certificate> getCertificateForCourse(UUID studentId, String email, UUID courseId) {
        UUID validStudentId = enrollmentService.getValidUserId(studentId, email);
        List<Certificate> list = certificateRepository.findByStudentIdAndCourseIdOrderByIssuedAtAsc(validStudentId, courseId);
        return (list != null && !list.isEmpty()) ? Optional.of(list.get(0)) : Optional.empty();
    }
}
