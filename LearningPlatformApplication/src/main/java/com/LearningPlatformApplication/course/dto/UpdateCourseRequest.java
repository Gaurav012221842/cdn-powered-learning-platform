package com.LearningPlatformApplication.course.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class UpdateCourseRequest {
    private String title;
    private String description;
    private BigDecimal price;
    private String status;
}
