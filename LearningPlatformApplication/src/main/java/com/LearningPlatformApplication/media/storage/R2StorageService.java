package com.LearningPlatformApplication.media.storage;

import com.LearningPlatformApplication.config.CloudflareR2Config;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class R2StorageService {

    private final CloudflareR2Config cloudflareR2Config;

    public String getBucketName() {
        return cloudflareR2Config.getBucketName();
    }
}
