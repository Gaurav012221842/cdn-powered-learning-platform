package com.videoworker.storage;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class R2Service {

    public void downloadRawFile(String rawKey, String localDestination) {
        log.info("Downloading R2 object: {} -> {}", rawKey, localDestination);
    }

    public void uploadSegmentedFolder(String localFolder, String destinationPrefix) {
        log.info("Uploading segmented HLS assets from {} to R2 destination {}", localFolder, destinationPrefix);
    }
}
