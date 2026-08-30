package com.videoworker.controller;

import com.videoworker.processor.HLSProcessor;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/worker")
@RequiredArgsConstructor
public class WorkerStatusController {

    private final HLSProcessor hlsProcessor;

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

    @PostMapping("/transcode/{mediaId}")
    public ResponseEntity<Map<String, Object>> triggerTranscode(@PathVariable String mediaId) {
        new Thread(() -> hlsProcessor.processVideoToHLS(mediaId)).start();
        return ResponseEntity.ok(Map.of(
                "message", "Transcoding process triggered for mediaId: " + mediaId,
                "status", "PROCESSING"
        ));
    }
}
