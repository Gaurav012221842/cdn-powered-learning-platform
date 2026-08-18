package com.LearningPlatformApplication.config;

import com.LearningPlatformApplication.common.ApiResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/config")
public class SiteConfigController {

    @Value("${site.name:ServerSide Learning Platform}")
    private String siteName;

    @Value("${site.title:ServerSide Learning Platform}")
    private String siteTitle;

    @Value("${site.owner:ServerSide}")
    private String siteOwner;

    @Value("${site.supportEmail:support@serversidegaurav.com}")
    private String supportEmail;

    @Value("${site.defaultTheme:light}")
    private String defaultTheme;

    @GetMapping("/site")
    public ResponseEntity<ApiResponse<Map<String, String>>> getSiteConfig() {
        Map<String, String> config = new HashMap<>();
        config.put("siteName", siteName);
        config.put("platformTitle", siteTitle);
        config.put("owner", siteOwner);
        config.put("supportEmail", supportEmail);
        config.put("defaultTheme", defaultTheme);
        config.put("version", "1.0.0");
        return ResponseEntity.ok(ApiResponse.success("Site configuration retrieved", config));
    }
}
