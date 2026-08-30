package com.videoworker.storage;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.http.urlconnection.UrlConnectionHttpClient;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.File;
import java.io.InputStream;
import java.net.URI;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.stream.Stream;

@Slf4j
@Service
public class R2Service {

    @Value("${cloudflare.r2.endpoint:}")
    private String endpoint;

    @Value("${cloudflare.r2.access-key:}")
    private String accessKey;

    @Value("${cloudflare.r2.secret-key:}")
    private String secretKey;

    @Value("${cloudflare.r2.bucket-name:learning-platform}")
    private String bucketName;

    private S3Client s3Client;

    @PostConstruct
    public void init() {
        if (endpoint == null || endpoint.isBlank() || endpoint.contains("account-id")) {
            log.warn("Cloudflare R2 endpoint not configured. R2Service running in mock/local mode.");
            return;
        }
        try {
            this.s3Client = S3Client.builder()
                    .endpointOverride(URI.create(endpoint))
                    .credentialsProvider(StaticCredentialsProvider.create(
                            AwsBasicCredentials.create(accessKey, secretKey)
                    ))
                    .region(Region.of("auto"))
                    .serviceConfiguration(S3Configuration.builder().pathStyleAccessEnabled(true).build())
                    .httpClient(UrlConnectionHttpClient.builder().build())
                    .build();
            log.info("Initialized Cloudflare R2 S3Client for bucket: {}", bucketName);
        } catch (Exception e) {
            log.warn("Failed initializing R2 S3Client: {}", e.getMessage());
        }
    }

    public boolean downloadRawFile(String rawKey, String localDestination) {
        log.info("Downloading R2 object '{}' -> local destination '{}'", rawKey, localDestination);
        if (s3Client == null) {
            log.warn("S3Client is null (mock mode). Creating placeholder for local file: {}", localDestination);
            try {
                Path destPath = Paths.get(localDestination);
                if (destPath.getParent() != null) {
                    Files.createDirectories(destPath.getParent());
                }
                if (!Files.exists(destPath)) {
                    Files.writeString(destPath, "Mock Video Data");
                }
                return true;
            } catch (Exception e) {
                log.error("Failed creating local destination directory: {}", e.getMessage());
                return false;
            }
        }

        try {
            Path destPath = Paths.get(localDestination);
            if (destPath.getParent() != null) {
                Files.createDirectories(destPath.getParent());
            }

            GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                    .bucket(bucketName)
                    .key(rawKey)
                    .build();

            try (InputStream in = s3Client.getObject(getObjectRequest)) {
                Files.copy(in, destPath, StandardCopyOption.REPLACE_EXISTING);
            }

            log.info("Successfully downloaded {} (size: {} bytes)", rawKey, Files.size(destPath));
            return true;
        } catch (Exception e) {
            log.error("Failed downloading R2 object {}: {}", rawKey, e.getMessage());
            return false;
        }
    }

    public boolean uploadSegmentedFolder(String localFolder, String destinationPrefix) {
        log.info("Uploading HLS segmented files from '{}' to R2 prefix '{}'", localFolder, destinationPrefix);
        Path folderPath = Paths.get(localFolder);
        if (!Files.exists(folderPath)) {
            log.warn("Local HLS output folder does not exist: {}", localFolder);
            return false;
        }

        if (s3Client == null) {
            log.info("Mock R2 upload complete for directory: {}", localFolder);
            return true;
        }

        try (Stream<Path> paths = Files.walk(folderPath)) {
            paths.filter(Files::isRegularFile).forEach(file -> {
                String relativeName = folderPath.relativize(file).toString().replace('\\', '/');
                String r2Key = destinationPrefix.endsWith("/")
                        ? destinationPrefix + relativeName
                        : destinationPrefix + "/" + relativeName;

                String contentType = determineContentType(file.getFileName().toString());

                try {
                    PutObjectRequest putRequest = PutObjectRequest.builder()
                            .bucket(bucketName)
                            .key(r2Key)
                            .contentType(contentType)
                            .build();

                    s3Client.putObject(putRequest, RequestBody.fromFile(file));
                    log.debug("Uploaded HLS segment: {} ({})", r2Key, contentType);
                } catch (Exception e) {
                    log.error("Failed uploading HLS file {} to R2: {}", file, e.getMessage());
                }
            });
            log.info("Finished uploading all segmented HLS assets to R2 under prefix '{}'", destinationPrefix);
            return true;
        } catch (Exception e) {
            log.error("Failed uploading HLS directory {}: {}", localFolder, e.getMessage());
            return false;
        }
    }

    private String determineContentType(String filename) {
        if (filename.endsWith(".m3u8")) {
            return "application/vnd.apple.mpegurl";
        }
        if (filename.endsWith(".ts")) {
            return "video/MP2T";
        }
        if (filename.endsWith(".mp4")) {
            return "video/mp4";
        }
        return "application/octet-stream";
    }
}
