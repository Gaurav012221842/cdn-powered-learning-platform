package com.LearningPlatformApplication.media.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class SignedUrlResponse {
    private String url;
    private long expiresInSeconds;
}
