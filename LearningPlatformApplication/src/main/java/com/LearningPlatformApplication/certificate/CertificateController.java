package com.LearningPlatformApplication.certificate;

import com.LearningPlatformApplication.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/certificates")
@RequiredArgsConstructor
public class CertificateController {

    private final CertificateService certificateService;

    @PostMapping("/generate")
    public ResponseEntity<ApiResponse<Certificate>> generateCertificate(@RequestParam UUID studentId, @RequestParam UUID courseId) {
        return ResponseEntity.ok(ApiResponse.success("Certificate generated", certificateService.generateCertificate(studentId, courseId)));
    }
}
