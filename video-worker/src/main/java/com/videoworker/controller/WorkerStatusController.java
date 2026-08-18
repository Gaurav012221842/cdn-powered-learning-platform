package com.videoworker.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/worker")
public class WorkerStatusController {

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getWorkerStatus() {
        return ResponseEntity.ok(Map.of(
                "service", "video-worker",
                "status", "UP",
                "mode", "FFmpeg HLS Transcoder & Cloudflare R2 Uploader",
                "kafkaTopic", "media-transcoding-events",
                "timestamp", java.time.ZonedDateTime.now().toString()
        ));
    }
}
