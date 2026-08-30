package com.LearningPlatformApplication.wishlist;

import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class WishlistService {

    private final WishlistRepository wishlistRepository;

    @Cacheable(value = "user_wishlist", key = "#studentId")
    public List<Wishlist> getUserWishlist(UUID studentId) {
        return wishlistRepository.findByStudentId(studentId);
    }

    @CacheEvict(value = {"user_wishlist", "wishlist_check"}, allEntries = true)
    public Wishlist addToWishlist(UUID studentId, UUID courseId) {
        return wishlistRepository.findByStudentIdAndCourseId(studentId, courseId)
                .orElseGet(() -> wishlistRepository.save(Wishlist.builder()
                        .studentId(studentId)
                        .courseId(courseId)
                        .build()));
    }

    @Transactional
    @CacheEvict(value = {"user_wishlist", "wishlist_check"}, allEntries = true)
    public void removeFromWishlist(UUID studentId, UUID courseId) {
        wishlistRepository.deleteByStudentIdAndCourseId(studentId, courseId);
    }

    @Cacheable(value = "wishlist_check", key = "#studentId.toString() + '_' + #courseId.toString()")
    public boolean isInWishlist(UUID studentId, UUID courseId) {
        return wishlistRepository.findByStudentIdAndCourseId(studentId, courseId).isPresent();
    }
}
