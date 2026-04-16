package com.healthcare.appointment.client;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.HashMap;
import java.util.Map;

/**
 * Client for calling the Notification Service from the Appointment Service.
 * ALL calls are wrapped in try/catch — a notification failure must NEVER
 * crash the appointment workflow.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationServiceClient {

    private final RestTemplate restTemplate;

    @Value("${notification.service.url:http://localhost:8080}")
    private String notificationServiceUrl;

    /**
     * Sends an appointment booking/confirmation email to the patient.
     * Called when: patient books (PENDING) or doctor confirms (CONFIRMED).
     */
    public void sendAppointmentConfirmationEmail(
            String patientEmail, String patientId, String patientName,
            String doctorName, String specialization,
            String appointmentDate, String appointmentTime) {
        try {
            String url = UriComponentsBuilder
                    .fromHttpUrl(notificationServiceUrl + "/api/notifications/email/appointment-confirmation")
                    .queryParam("email", patientEmail)
                    .queryParam("recipientId", patientId)
                    .queryParam("patientName", patientName)
                    .queryParam("doctorName", doctorName)
                    .queryParam("specialization", specialization)
                    .queryParam("appointmentDate", appointmentDate)
                    .queryParam("appointmentTime", appointmentTime)
                    .build().toUriString();

            restTemplate.postForObject(url, null, String.class);
            log.info("Appointment confirmation email sent to: {}", patientEmail);
        } catch (Exception e) {
            log.warn("Failed to send appointment confirmation email to {} — {} (appointment flow continues)",
                    patientEmail, e.getMessage());
        }
    }

    /**
     * Sends an appointment cancellation email to the patient.
     * Called when: doctor or patient cancels an appointment.
     */
    public void sendAppointmentCancellationEmail(
            String patientEmail, String patientId, String patientName,
            String doctorName, String appointmentDate, String appointmentTime,
            String reason) {
        try {
            String url = UriComponentsBuilder
                    .fromHttpUrl(notificationServiceUrl + "/api/notifications/email/cancellation")
                    .queryParam("email", patientEmail)
                    .queryParam("recipientId", patientId)
                    .queryParam("patientName", patientName)
                    .queryParam("doctorName", doctorName)
                    .queryParam("appointmentDate", appointmentDate)
                    .queryParam("appointmentTime", appointmentTime)
                    .queryParam("reason", reason != null ? reason : "Appointment cancelled")
                    .build().toUriString();

            restTemplate.postForObject(url, null, String.class);
            log.info("Appointment cancellation email sent to: {}", patientEmail);
        } catch (Exception e) {
            log.warn("Failed to send appointment cancellation email to {} — {} (appointment flow continues)",
                    patientEmail, e.getMessage());
        }
    }
}
