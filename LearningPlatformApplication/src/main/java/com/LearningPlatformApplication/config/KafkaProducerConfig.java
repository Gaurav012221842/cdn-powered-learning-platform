package com.LearningPlatformApplication.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.common.serialization.StringSerializer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;
import org.springframework.kafka.core.DefaultKafkaProducerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.core.ProducerFactory;

import java.util.HashMap;
import java.util.Map;

@Configuration
public class KafkaProducerConfig {

    @Value("${spring.kafka.bootstrap-servers:localhost:9092}")
    private String bootstrapServers;

    @Value("${KAFKA_API_KEY:}")
    private String apiKey;

    @Value("${KAFKA_API_SECRET:}")
    private String apiSecret;

    @Value("${spring.kafka.properties.security.protocol:}")
    private String securityProtocol;

    @Value("${spring.kafka.properties.sasl.mechanism:}")
    private String saslMechanism;

    @Value("${spring.kafka.properties.sasl.jaas.config:}")
    private String saslJaasConfig;

    @Bean
    public ProducerFactory<String, String> producerFactory() {
        Map<String, Object> configProps = new HashMap<>();
        configProps.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        configProps.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        configProps.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        configProps.put(ProducerConfig.RETRIES_CONFIG, 3);
        configProps.put(ProducerConfig.MAX_BLOCK_MS_CONFIG, 5000);

        // Configure SASL_SSL for Confluent Cloud / Cloud Kafka
        if (apiKey != null && !apiKey.isBlank() && apiSecret != null && !apiSecret.isBlank()) {
            configProps.put("security.protocol", "SASL_SSL");
            configProps.put("sasl.mechanism", "PLAIN");
            configProps.put("sasl.jaas.config", String.format(
                    "org.apache.kafka.common.security.plain.PlainLoginModule required username=\"%s\" password=\"%s\";",
                    apiKey.trim(), apiSecret.trim()
            ));
        } else if (saslJaasConfig != null && !saslJaasConfig.isBlank()) {
            configProps.put("security.protocol", securityProtocol != null && !securityProtocol.isBlank() ? securityProtocol : "SASL_SSL");
            configProps.put("sasl.mechanism", saslMechanism != null && !saslMechanism.isBlank() ? saslMechanism : "PLAIN");
            configProps.put("sasl.jaas.config", saslJaasConfig);
        }

        return new DefaultKafkaProducerFactory<>(configProps);
    }

    @Bean
    public KafkaTemplate<String, String> kafkaTemplate() {
        return new KafkaTemplate<>(producerFactory());
    }

    @Bean
    public NewTopic mediaTranscodingEventsTopic() {
        return TopicBuilder.name("media-transcoding-events")
                .partitions(1)
                .replicas(1)
                .build();
    }
}
