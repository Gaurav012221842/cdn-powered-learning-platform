package com.LearningPlatformApplication.wishlist;

import com.LearningPlatformApplication.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/wishlists")
@RequiredArgsConstructor
public class WishlistController {

    private final WishlistService wishlistService;

    @GetMapping("/student/{studentId}")
    public ResponseEntity<ApiResponse<List<Wishlist>>> getWishlist(@PathVariable UUID studentId) {
        return ResponseEntity.ok(ApiResponse.success("Wishlist retrieved", wishlistService.getUserWishlist(studentId)));
    }

    @GetMapping("/check")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> checkWishlist(
            @RequestParam UUID studentId,
            @RequestParam UUID courseId) {
        boolean inWishlist = wishlistService.isInWishlist(studentId, courseId);
        return ResponseEntity.ok(ApiResponse.success("Wishlist check completed", Map.of("inWishlist", inWishlist)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Wishlist>> addToWishlist(
            @RequestParam UUID studentId,
            @RequestParam UUID courseId) {
        return ResponseEntity.ok(ApiResponse.success("Added to wishlist", wishlistService.addToWishlist(studentId, courseId)));
    }

    @DeleteMapping
    public ResponseEntity<ApiResponse<String>> removeFromWishlist(
            @RequestParam UUID studentId,
            @RequestParam UUID courseId) {
        wishlistService.removeFromWishlist(studentId, courseId);
        return ResponseEntity.ok(ApiResponse.success("Removed from wishlist", "SUCCESS"));
    }
}
