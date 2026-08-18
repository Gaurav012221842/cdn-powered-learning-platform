package com.LearningPlatformApplication.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Configuration
public class CloudflareR2Config {

    @Value("${cloudflare.r2.endpoint:https://account-id.r2.cloudflarestorage.com}")
    private String endpoint;

    @Value("${cloudflare.r2.access-key:dev}")
    private String accessKey;

    @Value("${cloudflare.r2.secret-key:dev}")
    private String secretKey;

    @Value("${cloudflare.r2.bucket-name:learning-platform}")
    private String bucketName;

    public String getBucketName() {
        return bucketName;
    }
}
