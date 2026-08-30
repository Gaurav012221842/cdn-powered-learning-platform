package com.LearningPlatformApplication.redis;

import com.LearningPlatformApplication.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.connection.RedisConnection;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/api/v1/redis")
@RequiredArgsConstructor
@Slf4j
public class RedisTestController {

    private final StringRedisTemplate stringRedisTemplate;
    private final RedisTemplate<String, Object> redisTemplate;
    private final RedisConnectionFactory connectionFactory;

    /**
     * Test Redis PING Connection
     */
    @GetMapping("/ping")
    public ResponseEntity<ApiResponse<Map<String, Object>>> pingRedis() {
        try (RedisConnection connection = connectionFactory.getConnection()) {
            String pingResult = connection.ping();
            Map<String, Object> details = new HashMap<>();
            details.put("ping", pingResult);
            details.put("connected", "PONG".equalsIgnoreCase(pingResult));
            details.put("status", "Redis server is alive and responding perfectly!");

            log.info("Redis Ping Result: {}", pingResult);
            return ResponseEntity.ok(ApiResponse.success("Redis PING successful!", details));
        } catch (Exception e) {
            log.error("Redis Ping Failure: {}", e.getMessage());
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Failed to connect to Redis: " + e.getMessage()));
        }
    }

    /**
     * Store a Key-Value pair in Redis with optional TTL (Time-To-Live in seconds)
     */
    @PostMapping("/set")
    public ResponseEntity<ApiResponse<Map<String, Object>>> setKey(
            @RequestParam String key,
            @RequestParam String value,
            @RequestParam(defaultValue = "300") long ttlSeconds) {

        try {
            stringRedisTemplate.opsForValue().set(key, value, ttlSeconds, TimeUnit.SECONDS);
            Map<String, Object> result = new HashMap<>();
            result.put("key", key);
            result.put("value", value);
            result.put("ttlSeconds", ttlSeconds);
            result.put("message", "Key set successfully in Redis!");

            log.info("Redis SET key={} value={} ttl={}s", key, value, ttlSeconds);
            return ResponseEntity.ok(ApiResponse.success("Key saved in Redis successfully", result));
        } catch (Exception e) {
            log.error("Error setting key in Redis: {}", e.getMessage());
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Failed to set key in Redis: " + e.getMessage()));
        }
    }

    /**
     * Retrieve a value by key from Redis
     */
    @GetMapping("/get")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getKey(@RequestParam String key) {
        try {
            String value = stringRedisTemplate.opsForValue().get(key);
            Long expire = stringRedisTemplate.getExpire(key, TimeUnit.SECONDS);

            Map<String, Object> result = new HashMap<>();
            result.put("key", key);
            result.put("value", value);
            result.put("exists", value != null);
            result.put("ttlRemainingSeconds", expire != null ? expire : -1);

            if (value == null) {
                return ResponseEntity.ok(ApiResponse.success("Key not found or expired in Redis", result));
            }

            return ResponseEntity.ok(ApiResponse.success("Key retrieved from Redis successfully", result));
        } catch (Exception e) {
            log.error("Error getting key from Redis: {}", e.getMessage());
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Failed to retrieve key from Redis: " + e.getMessage()));
        }
    }

    /**
     * List all keys in Redis matching pattern (default *)
     */
    @GetMapping("/keys")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getKeys(@RequestParam(defaultValue = "*") String pattern) {
        try {
            Set<String> keys = stringRedisTemplate.keys(pattern);
            Map<String, Object> result = new HashMap<>();
            result.put("pattern", pattern);
            result.put("totalKeys", keys != null ? keys.size() : 0);
            result.put("keys", keys);

            return ResponseEntity.ok(ApiResponse.success("Redis keys fetched successfully", result));
        } catch (Exception e) {
            log.error("Error fetching keys from Redis: {}", e.getMessage());
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Failed to fetch keys from Redis: " + e.getMessage()));
        }
    }

    /**
     * Delete a key from Redis
     */
    @DeleteMapping("/delete")
    public ResponseEntity<ApiResponse<Map<String, Object>>> deleteKey(@RequestParam String key) {
        try {
            Boolean deleted = stringRedisTemplate.delete(key);
            Map<String, Object> result = new HashMap<>();
            result.put("key", key);
            result.put("deleted", Boolean.TRUE.equals(deleted));

            return ResponseEntity.ok(ApiResponse.success("Key operation completed in Redis", result));
        } catch (Exception e) {
            log.error("Error deleting key from Redis: {}", e.getMessage());
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Failed to delete key from Redis: " + e.getMessage()));
        }
    }
}
