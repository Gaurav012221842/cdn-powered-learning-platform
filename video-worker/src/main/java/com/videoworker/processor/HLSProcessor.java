package com.videoworker.processor;

import com.videoworker.storage.R2Service;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Comparator;

@Slf4j
@Service
@RequiredArgsConstructor
public class HLSProcessor {

    private final FFmpegProcessor ffmpegProcessor;
    private final R2Service r2Service;

    public void processVideoToHLS(String mediaId) {
        log.info("▶️ [VideoWorker] Starting HLS multi-bitrate processing for mediaId: {}", mediaId);

        String tempDir = System.getProperty("java.io.tmpdir");
        String localRawVideo = tempDir + "/video_raw_" + mediaId + ".mp4";
        String localHlsOutputFolder = tempDir + "/hls_" + mediaId;

        try {
            // 1. Download raw uploaded video from Cloudflare R2
            String r2RawKey = "videos/raw/" + mediaId + ".mp4";
            boolean downloaded = r2Service.downloadRawFile(r2RawKey, localRawVideo);
            if (!downloaded) {
                // Try alternate key format
                r2RawKey = "raw/" + mediaId + ".mp4";
                r2Service.downloadRawFile(r2RawKey, localRawVideo);
            }

            // 2. Transcode into multi-bitrate HLS (.m3u8 + 4-sec .ts segments)
            boolean transcoded = ffmpegProcessor.executeTranscodeCommand(localRawVideo, localHlsOutputFolder);
            if (!transcoded) {
                log.error("❌ FFmpeg transcoding failed for mediaId: {}", mediaId);
                return;
            }

            // 3. Upload all segmented HLS chunks (.m3u8 and .ts) directly to Cloudflare R2
            String r2HlsDestination = "hls/" + mediaId;
            boolean uploaded = r2Service.uploadSegmentedFolder(localHlsOutputFolder, r2HlsDestination);
            if (uploaded) {
                log.info("✅ [VideoWorker] Successfully completed HLS segmentation & uploaded to R2 for mediaId: {} -> {}/master.m3u8",
                        mediaId, r2HlsDestination);
            } else {
                log.error("❌ Failed uploading HLS files to Cloudflare R2 for mediaId: {}", mediaId);
            }
        } catch (Exception e) {
            log.error("❌ Error in HLS processing pipeline for mediaId {}: {}", mediaId, e.getMessage(), e);
        } finally {
            // Clean up temporary local scratch files
            cleanupTempFiles(localRawVideo, localHlsOutputFolder);
        }
    }

    private void cleanupTempFiles(String rawVideoPath, String hlsFolderPath) {
        try {
            Path rawFile = Paths.get(rawVideoPath);
            if (Files.exists(rawFile)) {
                Files.deleteIfExists(rawFile);
            }
            Path hlsDir = Paths.get(hlsFolderPath);
            if (Files.exists(hlsDir)) {
                Files.walk(hlsDir)
                        .sorted(Comparator.reverseOrder())
                        .map(Path::toFile)
                        .forEach(File::delete);
            }
            log.debug("Cleaned up temporary video worker scratch files for {}", hlsFolderPath);
        } catch (Exception e) {
            log.debug("Could not clean scratch files: {}", e.getMessage());
        }
    }
}
