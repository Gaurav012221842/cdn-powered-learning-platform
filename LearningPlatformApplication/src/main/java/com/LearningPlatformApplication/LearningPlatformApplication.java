package com.LearningPlatformApplication;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@EnableAsync
@SpringBootApplication(exclude = {
		org.springframework.boot.autoconfigure.kafka.KafkaAutoConfiguration.class
})
public class LearningPlatformApplication {

	public static void main(String[] args) {
		SpringApplication.run(LearningPlatformApplication.class, args);
	}

}
