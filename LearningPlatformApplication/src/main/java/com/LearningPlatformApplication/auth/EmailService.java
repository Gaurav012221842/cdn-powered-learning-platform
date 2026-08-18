package com.LearningPlatformApplication.auth;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:support@gauravlearn.com}")
    private String fromEmail;

    @Async
    public void sendPasswordResetEmail(String toEmail, String otpCode) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("🔐 Password Reset Verification Code - Gaurav's Learning Platform");

            String resetUrl = "http://localhost:3000/reset-password?email=" + java.net.URLEncoder.encode(toEmail, java.nio.charset.StandardCharsets.UTF_8) + "&token=" + otpCode;

            String htmlContent = "<div style=\"font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #f8fafc; border-radius: 16px; border: 1px solid #e2e8f0;\">"
                    + "<div style=\"text-align: center; margin-bottom: 24px;\">"
                    + "<h2 style=\"color: #4f46e5; margin: 0; font-size: 24px;\">Gaurav's CDN Learning Platform</h2>"
                    + "<p style=\"color: #64748b; font-size: 14px; margin-top: 4px;\">Secure Account Recovery</p>"
                    + "</div>"
                    + "<div style=\"background: #ffffff; padding: 24px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); text-align: center;\">"
                    + "<p style=\"font-size: 15px; color: #334155; line-height: 1.6;\">You requested a password reset for your account. Click the button below to reset your password directly, or copy the 6-digit code:</p>"
                    + "<div style=\"margin: 20px 0;\">"
                    + "<a href=\"" + resetUrl + "\" style=\"background: #4f46e5; color: #ffffff; padding: 12px 24px; border-radius: 10px; text-decoration: none; font-weight: 800; font-size: 14px; display: inline-block;\">🔗 Reset Password Now</a>"
                    + "</div>"
                    + "<p style=\"font-size: 13px; color: #64748b; margin-top: 16px;\">Or enter this code manually on the reset page:</p>"
                    + "<div style=\"margin: 16px 0; padding: 14px; background: #f1f5f9; border-radius: 12px; font-size: 28px; font-weight: 800; letter-spacing: 6px; color: #4f46e5; font-family: monospace;\">"
                    + otpCode
                    + "</div>"
                    + "<p style=\"font-size: 13px; color: #94a3b8;\">This link and code are valid for <strong>15 minutes</strong>. If you did not request a password reset, please ignore this email.</p>"
                    + "</div>"
                    + "<div style=\"text-align: center; margin-top: 24px; font-size: 12px; color: #94a3b8;\">"
                    + "&copy; 2026 Gaurav's Learning Platform. All rights reserved."
                    + "</div>"
                    + "</div>";

            helper.setText(htmlContent, true);
            mailSender.send(message);
            log.info("Password reset email sent successfully via JavaMailSender to {}", toEmail);
        } catch (Exception e) {
            log.warn("Failed to send password reset email via JavaMailSender to {}: {}", toEmail, e.getMessage());
        }
    }
}
