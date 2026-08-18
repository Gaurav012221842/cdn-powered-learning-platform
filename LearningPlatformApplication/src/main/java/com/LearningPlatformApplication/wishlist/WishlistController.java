package com.LearningPlatformApplication.wishlist;

import com.LearningPlatformApplication.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
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

    @PostMapping
    public ResponseEntity<ApiResponse<Wishlist>> addToWishlist(@RequestParam UUID studentId, @RequestParam UUID courseId) {
        return ResponseEntity.ok(ApiResponse.success("Added to wishlist", wishlistService.addToWishlist(studentId, courseId)));
    }
}
