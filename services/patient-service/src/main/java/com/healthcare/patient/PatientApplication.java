package com.healthcare.patient;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.netflix.eureka.EnableEurekaClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@SpringBootApplication
@EnableEurekaClient
@RestController
public class PatientApplication {

    public static void main(String[] args) {
        SpringApplication.run(PatientApplication.class, args);
    }

    @GetMapping("/api/patients/health")
    public String health() {
        return "Patient Service is up and running!";
    }
}
