package com.healthcare.ai.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI aiServiceOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("AI Symptom Checker Service")
                        .version("1.0.0")
                        .description("Preliminary symptom analysis service for patients with history tracking and doctor specialty recommendations.")
                        .contact(new Contact().name("Healthcare Microservices Team")));
    }
}
