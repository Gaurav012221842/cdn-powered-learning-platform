package com.LearningPlatformApplication.auth;

import com.LearningPlatformApplication.security.JwtService;
import com.LearningPlatformApplication.security.TokenBlacklistService;
import com.LearningPlatformApplication.user.User;
import com.LearningPlatformApplication.user.UserRepository;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.ZonedDateTime;
import java.util.Map;
import java.util.Random;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final TokenBlacklistService tokenBlacklistService;
    private final EmailService emailService;

    // In-memory OTP code cache for password resets with 15-minute expiration
    private final Map<String, ResetCodeInfo> resetCodeStore = new ConcurrentHashMap<>();

    @Data
    @AllArgsConstructor
    private static class ResetCodeInfo {
        private String code;
        private ZonedDateTime expiresAt;
    }

    public AuthResponse register(RegisterRequest request) {
        if (request == null || request.getEmail() == null || request.getPassword() == null) {
            throw new IllegalArgumentException("Email and password are required");
        }

        String email = request.getEmail().trim();
        if (userRepository.findByEmail(email).isPresent()) {
            throw new IllegalArgumentException("User already exists with this email");
        }

        // Enforce strong password policy: Uppercase, Lowercase, Number, Symbol, 8+ chars
        PasswordValidator.validate(request.getPassword());

        User user = User.builder()
                .id(UUID.randomUUID())
                .email(email)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .role(request.getRole() != null ? request.getRole() : "STUDENT")
                .build();

        userRepository.save(user);
        org.springframework.security.core.userdetails.User userDetails =
                new org.springframework.security.core.userdetails.User(
                        user.getEmail(),
                        user.getPasswordHash(),
                        java.util.Collections.singletonList(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_" + user.getRole()))
                );
        String jwtToken = jwtService.generateToken(userDetails);

        return AuthResponse.builder()
                .id(user.getId())
                .token(jwtToken)
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .avatarUrl(user.getAvatarUrl())
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        if (request == null || request.getEmail() == null || request.getPassword() == null) {
            throw new IllegalArgumentException("Email and password are required");
        }

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail().trim(), request.getPassword())
        );
        User user = userRepository.findByEmail(request.getEmail().trim())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        org.springframework.security.core.userdetails.User userDetails =
                new org.springframework.security.core.userdetails.User(
                        user.getEmail(),
                        user.getPasswordHash(),
                        java.util.Collections.singletonList(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_" + user.getRole()))
                );
        String jwtToken = jwtService.generateToken(userDetails);

        return AuthResponse.builder()
                .id(user.getId())
                .token(jwtToken)
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .avatarUrl(user.getAvatarUrl())
                .build();
    }

    public void logout(String token) {
        tokenBlacklistService.blacklist(token);
    }

    public String forgotPassword(ForgotPasswordRequest request) {
        if (request == null || request.getEmail() == null || request.getEmail().isBlank()) {
            throw new IllegalArgumentException("Email is required");
        }

        String email = request.getEmail().trim().toLowerCase();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("No user found with email: " + email));

        // Generate a 6-digit numeric OTP code
        String otpCode = String.format("%06d", new Random().nextInt(999999));
        resetCodeStore.put(email, new ResetCodeInfo(otpCode, ZonedDateTime.now().plusMinutes(15)));

        // Send email via JavaMailSender
        emailService.sendPasswordResetEmail(user.getEmail(), otpCode);
        log.info("Generated reset OTP {} for user {}", otpCode, email);

        return otpCode;
    }

    public void resetPassword(ResetPasswordRequest request) {
        if (request == null || request.getEmail() == null || request.getNewPassword() == null) {
            throw new IllegalArgumentException("Email, reset code, and new password are required");
        }

        String email = request.getEmail().trim().toLowerCase();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("No user found with email: " + email));

        // Validate strong password policy
        PasswordValidator.validate(request.getNewPassword());

        // Verify OTP code if present in store
        ResetCodeInfo codeInfo = resetCodeStore.get(email);
        if (codeInfo != null) {
            if (ZonedDateTime.now().isAfter(codeInfo.getExpiresAt())) {
                resetCodeStore.remove(email);
                throw new IllegalArgumentException("Password reset code has expired. Please request a new code.");
            }
            if (request.getToken() != null && !request.getToken().isBlank() && !request.getToken().equalsIgnoreCase(codeInfo.getCode())) {
                throw new IllegalArgumentException("Invalid verification reset code.");
            }
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        resetCodeStore.remove(email);
        log.info("Password successfully reset for user {}", email);
    }

    public AuthResponse validateToken(String token) {
        String userEmail = jwtService.extractUsername(token);
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("Invalid token: User not found"));

        org.springframework.security.core.userdetails.User userDetails =
                new org.springframework.security.core.userdetails.User(
                        user.getEmail(),
                        user.getPasswordHash(),
                        java.util.Collections.singletonList(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_" + user.getRole()))
                );

        if (!jwtService.isTokenValid(token, userDetails)) {
            throw new IllegalArgumentException("Invalid or expired JWT token");
        }

        return AuthResponse.builder()
                .id(user.getId())
                .token(token)
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .avatarUrl(user.getAvatarUrl())
                .build();
    }

    public void changePassword(ChangePasswordRequest request) {
        if (request == null || request.getEmail() == null || request.getCurrentPassword() == null || request.getNewPassword() == null) {
            throw new IllegalArgumentException("Email, current password, and new password are required");
        }

        String email = request.getEmail().trim().toLowerCase();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("No user found with email: " + email));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Current password is incorrect");
        }

        // Validate strong password policy
        PasswordValidator.validate(request.getNewPassword());

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        log.info("Password changed successfully for user {}", email);
    }
}
