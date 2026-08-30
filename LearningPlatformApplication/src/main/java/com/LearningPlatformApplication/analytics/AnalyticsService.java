package com.LearningPlatformApplication.analytics;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class AnalyticsService {

    @Cacheable(value = "analytics_overview", key = "'overview'")
    public Map<String, Object> getOverviewMetrics() {
        Map<String, Object> metrics = new HashMap<>();
        metrics.put("totalStudents", 1250);
        metrics.put("totalCourses", 48);
        metrics.put("monthlyRevenue", 15400.00);
        metrics.put("activeCampaigns", 3);
        return metrics;
    }
}
