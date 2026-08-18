package com.LearningPlatformApplication.notification;

import org.springframework.stereotype.Service;

import java.time.ZonedDateTime;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Service
public class NotificationService {

    public List<Notification> getUserNotifications(UUID userId) {
        return Collections.singletonList(
                Notification.builder()
                        .id(UUID.randomUUID())
                        .userId(userId)
                        .title("Welcome to the platform!")
                        .message("Start exploring top software engineering courses today.")
                        .isRead(false)
                        .createdAt(ZonedDateTime.now())
                        .build()
        );
    }
}
