package com.LearningPlatformApplication.media.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AvatarUploadRequest {
    private String fileName;
    private String contentType;
}
