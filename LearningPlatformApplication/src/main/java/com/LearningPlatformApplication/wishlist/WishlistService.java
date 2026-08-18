package com.LearningPlatformApplication.wishlist;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class WishlistService {

    private final WishlistRepository wishlistRepository;

    public List<Wishlist> getUserWishlist(UUID studentId) {
        return wishlistRepository.findByStudentId(studentId);
    }

    public Wishlist addToWishlist(UUID studentId, UUID courseId) {
        return wishlistRepository.findByStudentIdAndCourseId(studentId, courseId)
                .orElseGet(() -> wishlistRepository.save(Wishlist.builder()
                        .studentId(studentId)
                        .courseId(courseId)
                        .build()));
    }
}
