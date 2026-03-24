package com.healthcare.doctor;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.netflix.eureka.EnableEurekaClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@SpringBootApplication
@EnableEurekaClient
@RestController
public class DoctorApplication {

    public static void main(String[] args) {
        SpringApplication.run(DoctorApplication.class, args);
    }

    @GetMapping("/api/doctors/health")
    public String health() {
        return "Doctor Service is up and running!";
    }
}
