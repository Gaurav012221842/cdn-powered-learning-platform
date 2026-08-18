package com.videoworker.processor;

import com.videoworker.storage.R2Service;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class HLSProcessor {

    private final FFmpegProcessor ffmpegProcessor;
    private final R2Service r2Service;

    public void processVideoToHLS(String mediaId) {
        log.info("Starting multi-bitrate HLS segmentation for mediaId: {}", mediaId);
        String rawKey = "raw/" + mediaId + ".mp4";
        r2Service.downloadRawFile(rawKey, "/tmp/" + mediaId + ".mp4");
        ffmpegProcessor.executeTranscodeCommand("/tmp/" + mediaId + ".mp4", "/tmp/hls/" + mediaId + "/index.m3u8");
        r2Service.uploadSegmentedFolder("/tmp/hls/" + mediaId, "hls/" + mediaId);
        log.info("Completed HLS encoding & R2 upload for mediaId: {}", mediaId);
    }
}
