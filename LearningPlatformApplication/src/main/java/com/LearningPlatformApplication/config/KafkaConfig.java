package com.LearningPlatformApplication.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

@Configuration
public class KafkaConfig {

    @Bean
    public NewTopic mediaTranscodingTopic() {
        return TopicBuilder.name("media-transcoding-events")
                .partitions(3)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic enrollmentEventsTopic() {
        return TopicBuilder.name("course-enrollment-events")
                .partitions(3)
                .replicas(1)
                .build();
    }
}
