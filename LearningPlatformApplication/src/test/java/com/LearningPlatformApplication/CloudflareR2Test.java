package com.LearningPlatformApplication;

import org.junit.jupiter.api.Test;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.net.URI;

public class CloudflareR2Test {

    @Test
    public void testR2Connection() {
        String endpoint = System.getenv("R2_ENDPOINT") != null ? System.getenv("R2_ENDPOINT") : "https://account-id.r2.cloudflarestorage.com";
        String accessKey = System.getenv("R2_ACCESS_KEY") != null ? System.getenv("R2_ACCESS_KEY") : "dev-access-key";
        String secretKey = System.getenv("R2_SECRET_KEY") != null ? System.getenv("R2_SECRET_KEY") : "dev-secret-key";
        String bucket = System.getenv("R2_BUCKET_NAME") != null ? System.getenv("R2_BUCKET_NAME") : "learning-platform";

        System.out.println("--- TESTING CLOUDFLARE R2 S3 CLIENT ---");

        S3Client client = S3Client.builder()
                .endpointOverride(URI.create(endpoint))
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(accessKey, secretKey)
                ))
                .region(Region.US_EAST_1)
                .serviceConfiguration(S3Configuration.builder()
                        .pathStyleAccessEnabled(true)
                        .build())
                .build();

        try {
            client.putObject(
                    PutObjectRequest.builder()
                            .bucket(bucket)
                            .key("test/hello.txt")
                            .contentType("text/plain")
                            .build(),
                    RequestBody.fromString("Hello Cloudflare R2 from Java!")
            );
            System.out.println("✅ SUCCESS: Uploaded test/hello.txt to Cloudflare R2 bucket!");
        } catch (Exception e) {
            System.err.println("❌ ERROR: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
