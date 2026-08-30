package com.videoworker.config;

import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.annotation.EnableKafka;
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory;
import org.springframework.kafka.core.ConsumerFactory;
import org.springframework.kafka.core.DefaultKafkaConsumerFactory;

import java.util.HashMap;
import java.util.Map;

@Configuration
@EnableKafka
public class KafkaConfig {

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
    public ConsumerFactory<String, String> consumerFactory() {
        Map<String, Object> props = new HashMap<>();
        props.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        props.put(ConsumerConfig.GROUP_ID_CONFIG, "video-worker-group");
        props.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
        props.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
        props.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");
        props.put(ConsumerConfig.RECONNECT_BACKOFF_MS_CONFIG, 10000);
        props.put(ConsumerConfig.RECONNECT_BACKOFF_MAX_MS_CONFIG, 30000);

        // Configure SASL_SSL for Confluent Cloud / Cloud Kafka
        if (apiKey != null && !apiKey.isBlank() && apiSecret != null && !apiSecret.isBlank()) {
            props.put("security.protocol", "SASL_SSL");
            props.put("sasl.mechanism", "PLAIN");
            props.put("sasl.jaas.config", String.format(
                    "org.apache.kafka.common.security.plain.PlainLoginModule required username=\"%s\" password=\"%s\";",
                    apiKey.trim(), apiSecret.trim()
            ));
        } else if (saslJaasConfig != null && !saslJaasConfig.isBlank()) {
            props.put("security.protocol", securityProtocol != null && !securityProtocol.isBlank() ? securityProtocol : "SASL_SSL");
            props.put("sasl.mechanism", saslMechanism != null && !saslMechanism.isBlank() ? saslMechanism : "PLAIN");
            props.put("sasl.jaas.config", saslJaasConfig);
        }

        return new DefaultKafkaConsumerFactory<>(props);
    }

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, String> kafkaListenerContainerFactory() {
        ConcurrentKafkaListenerContainerFactory<String, String> factory =
                new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(consumerFactory());
        return factory;
    }
}
