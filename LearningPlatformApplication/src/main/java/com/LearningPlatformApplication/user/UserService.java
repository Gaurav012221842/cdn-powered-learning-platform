package com.LearningPlatformApplication.user;

import com.LearningPlatformApplication.exception.BusinessException;
import com.LearningPlatformApplication.user.dto.UpdateProfileRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public User getUserById(UUID id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found: " + id));
    }

    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + email));
    }

    public User updateProfile(String userEmail, UpdateProfileRequest request) {
        User user = getUserByEmail(userEmail);
        if (request.getFullName() != null && !request.getFullName().isBlank()) {
            user.setFullName(request.getFullName());
        }
        if (request.getAvatarUrl() != null && !request.getAvatarUrl().isBlank()) {
            String avatarUrl = request.getAvatarUrl().trim();
            try {
                URI uri = URI.create(avatarUrl);
                String scheme = uri.getScheme();
                if (!"http".equalsIgnoreCase(scheme) && !"https".equalsIgnoreCase(scheme)) {
                    throw new BusinessException("Avatar URL must be a valid http(s) URL");
                }
                user.setAvatarUrl(avatarUrl);
            } catch (IllegalArgumentException ex) {
                throw new BusinessException("Avatar URL must be a valid http(s) URL");
            }
        }
        user.setUpdatedAt(ZonedDateTime.now());
        return userRepository.save(user);
    }
}
