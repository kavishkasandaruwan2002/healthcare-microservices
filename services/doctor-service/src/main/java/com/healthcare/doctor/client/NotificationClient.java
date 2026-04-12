package com.healthcare.doctor.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

/**
 * Feign client that calls the notification-service to trigger email notifications
 * for doctor lifecycle events (registration, approval, rejection).
 */
@FeignClient(name = "notification-service", path = "/api/notifications")
public interface NotificationClient {

    /**
     * Sends a "registration received, pending review" email to the doctor.
     */
    @PostMapping("/email/doctor-registration")
    void sendDoctorRegistrationEmail(
            @RequestParam("email") String email,
            @RequestParam("recipientId") String recipientId,
            @RequestParam("doctorName") String doctorName,
            @RequestParam("specialization") String specialization
    );

    /**
     * Sends a "congratulations, your account is approved" email to the doctor.
     */
    @PostMapping("/email/doctor-approved")
    void sendDoctorApprovedEmail(
            @RequestParam("email") String email,
            @RequestParam("recipientId") String recipientId,
            @RequestParam("doctorName") String doctorName,
            @RequestParam("specialization") String specialization
    );

    /**
     * Sends a "your application was not approved" email to the doctor.
     */
    @PostMapping("/email/doctor-rejected")
    void sendDoctorRejectedEmail(
            @RequestParam("email") String email,
            @RequestParam("recipientId") String recipientId,
            @RequestParam("doctorName") String doctorName,
            @RequestParam("rejectionReason") String rejectionReason
    );
}
