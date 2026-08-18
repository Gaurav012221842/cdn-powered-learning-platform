package com.videoworker.processor;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class FFmpegProcessor {

    public boolean executeTranscodeCommand(String inputPath, String outputPlaylistPath) {
        log.info("Executing FFmpeg HLS conversion: {} -> {}", inputPath, outputPlaylistPath);
        return true;
    }
}
