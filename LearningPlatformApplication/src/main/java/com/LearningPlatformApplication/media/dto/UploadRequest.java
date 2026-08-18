package com.LearningPlatformApplication.media.dto;

import com.LearningPlatformApplication.media.MediaType;
import lombok.Data;

@Data
public class UploadRequest {
    private String originalFilename;
    private MediaType mediaType;
    private String mimeType;
    private Long fileSize;
}
