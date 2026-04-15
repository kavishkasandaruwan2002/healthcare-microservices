package com.medisync.payment.config;

import feign.RequestInterceptor;
import feign.RequestTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class FeignConfig {

    @Value("${service.secret}")
    private String serviceSecret;

    @Bean
    public RequestInterceptor serviceAuthRequestInterceptor() {
        return (RequestTemplate template) -> {
            template.header("X-Service-Secret", serviceSecret);
        };
    }
}
