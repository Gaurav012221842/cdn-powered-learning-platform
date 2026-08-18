package com.LearningPlatformApplication.certificate;

import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class CertificateService {

    public Certificate generateCertificate(UUID studentId, UUID courseId) {
        return Certificate.builder()
                .studentId(studentId)
                .courseId(courseId)
                .build();
    }
}
