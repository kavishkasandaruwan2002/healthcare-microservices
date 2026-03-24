package com.healthcare.telemedicine;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.netflix.eureka.EnableEurekaClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@SpringBootApplication
@EnableEurekaClient
@RestController
public class TelemedicineApplication {

    public static void main(String[] args) {
        SpringApplication.run(TelemedicineApplication.class, args);
    }

    @GetMapping("/api/telemedicine/health")
    public String health() {
        return "Telemedicine Service is up and running!";
    }
}
