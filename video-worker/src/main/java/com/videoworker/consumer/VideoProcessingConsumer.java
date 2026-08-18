package com.videoworker.consumer;

import com.videoworker.processor.HLSProcessor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class VideoProcessingConsumer {

    private final HLSProcessor hlsProcessor;

    @KafkaListener(topics = "media-transcoding-events", groupId = "video-worker-group")
    public void consumeTranscodingEvent(String mediaId) {
        log.info("Received video transcoding event for mediaId: {}", mediaId);
        hlsProcessor.processVideoToHLS(mediaId);
    }
}
