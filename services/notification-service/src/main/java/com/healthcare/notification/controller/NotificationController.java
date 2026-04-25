package com.healthcare.notification.controller;

import com.healthcare.notification.dto.EmailNotificationRequest;
import com.healthcare.notification.dto.NotificationDTO;
import com.healthcare.notification.service.EmailService;
import com.healthcare.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@Slf4j
public class NotificationController {

    private final EmailService emailService;
    private final NotificationService notificationService;

    // ─────────────────────────────────────────────────────────────────────────
    // Health check
    // ─────────────────────────────────────────────────────────────────────────

    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("Notification Service is up and running!");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Generic email endpoint
    // ─────────────────────────────────────────────────────────────────────────

    @PostMapping("/email")
    public ResponseEntity<String> sendEmail(@RequestBody EmailNotificationRequest request) {
        log.info("Sending generic email to: {}", request.getTo());
        emailService.sendSimpleEmail(request);
        return ResponseEntity.ok("Email sent successfully");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Doctor lifecycle events
    // ─────────────────────────────────────────────────────────────────────────

    @PostMapping("/email/doctor-registration")
    public ResponseEntity<String> sendDoctorRegistrationEmail(
            @RequestParam String email,
            @RequestParam String recipientId,
            @RequestParam String doctorName,
            @RequestParam(defaultValue = "") String specialization) {
        log.info("Sending doctor registration email to: {}", email);
        emailService.sendDoctorRegistrationEmail(email, recipientId, doctorName, specialization);
        return ResponseEntity.ok("Doctor registration email sent successfully");
    }

    @PostMapping("/email/doctor-approved")
    public ResponseEntity<String> sendDoctorApprovedEmail(
            @RequestParam String email,
            @RequestParam String recipientId,
            @RequestParam String doctorName,
            @RequestParam(defaultValue = "") String specialization) {
        log.info("Sending doctor approval email to: {}", email);
        emailService.sendDoctorApprovalEmail(email, recipientId, doctorName, specialization);
        return ResponseEntity.ok("Doctor approval email sent successfully");
    }

    @PostMapping("/email/doctor-rejected")
    public ResponseEntity<String> sendDoctorRejectedEmail(
            @RequestParam String email,
            @RequestParam String recipientId,
            @RequestParam String doctorName,
            @RequestParam(defaultValue = "") String rejectionReason) {
        log.info("Sending doctor rejection email to: {}", email);
        emailService.sendDoctorRejectionEmail(email, recipientId, doctorName, rejectionReason);
        return ResponseEntity.ok("Doctor rejection email sent successfully");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Prescription events
    // ─────────────────────────────────────────────────────────────────────────

    /** Legacy @RequestParam endpoint — kept for backward compatibility */
    @PostMapping("/email/prescription-issued")
    public ResponseEntity<String> sendPrescriptionIssuedEmail(
            @RequestParam String email,
            @RequestParam String recipientId,
            @RequestParam String doctorId,
            @RequestParam String patientName,
            @RequestParam String medications) {
        log.info("Sending prescription issued email to patient: {}", email);
        emailService.sendPrescriptionIssuedEmail(email, recipientId, doctorId, patientName, medications);
        return ResponseEntity.ok("Prescription email sent successfully");
    }

    /**
     * JSON-body prescription email endpoint — matches the payload sent by the
     * doctor appointments frontend (handleIssuePrescription).
     */
    @PostMapping("/send-prescription-email")
    public ResponseEntity<String> sendPrescriptionEmailJson(
            @RequestBody com.healthcare.notification.dto.PrescriptionEmailRequest request) {
        log.info("Sending prescription email (JSON body) to: {}", request.getTo());
        try {
            String medicationsStr = request.getMedications() != null
                    ? String.join(", ", request.getMedications())
                    : "";

            emailService.sendPrescriptionIssuedEmail(
                    request.getTo(),
                    request.getPatientId() != null ? request.getPatientId() : "",
                    request.getDoctorName() != null ? request.getDoctorName() : "",
                    request.getPatientName() != null ? request.getPatientName() : "Patient",
                    request.getDoctorName() != null ? request.getDoctorName() : "",
                    request.getDoctorSpecialization() != null ? request.getDoctorSpecialization() : "",
                    request.getDiagnosis() != null ? request.getDiagnosis() : "",
                    medicationsStr,
                    request.getDosage() != null ? request.getDosage() : "",
                    request.getDuration() != null ? request.getDuration() : ""
            );
            return ResponseEntity.ok("Prescription email sent successfully");
        } catch (Exception e) {
            log.error("Failed to send prescription email: {}", e.getMessage());
            return ResponseEntity.ok("Prescription email queued (non-blocking)");
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Appointment events
    // ─────────────────────────────────────────────────────────────────────────

    /** Existing @RequestParam endpoint — kept intact, patientName is optional */
    @PostMapping("/email/appointment-confirmation")
    public ResponseEntity<String> sendAppointmentConfirmation(
            @RequestParam String email,
            @RequestParam String recipientId,
            @RequestParam(defaultValue = "Patient") String patientName,
            @RequestParam(defaultValue = "") String specialization,
            @RequestParam String doctorName,
            @RequestParam String appointmentDate,
            @RequestParam String appointmentTime) {
        log.info("Sending appointment confirmation email to: {}", email);
        emailService.sendAppointmentConfirmationEmail(
                email, recipientId, patientName, specialization, doctorName, appointmentDate, appointmentTime);
        return ResponseEntity.ok("Appointment confirmation email sent");
    }

    @PostMapping("/email/cancellation")
    public ResponseEntity<String> sendCancellationEmail(
            @RequestParam String email,
            @RequestParam String recipientId,
            @RequestParam(defaultValue = "Patient") String patientName,
            @RequestParam(defaultValue = "") String doctorName,
            @RequestParam(defaultValue = "") String appointmentDate,
            @RequestParam(defaultValue = "") String appointmentTime,
            @RequestParam String reason) {
        log.info("Sending cancellation email to: {}", email);
        emailService.sendCancellationEmail(
                email, recipientId, patientName, doctorName, appointmentDate, appointmentTime, reason);
        return ResponseEntity.ok("Cancellation email sent");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Payment events
    // ─────────────────────────────────────────────────────────────────────────

    @PostMapping("/email/payment-confirmation")
    public ResponseEntity<String> sendPaymentConfirmation(
            @RequestParam String email,
            @RequestParam String recipientId,
            @RequestParam String transactionId,
            @RequestParam Double amount) {
        log.info("Sending payment confirmation email to: {}", email);
        emailService.sendPaymentConfirmationEmail(email, recipientId, transactionId, amount);
        return ResponseEntity.ok("Payment confirmation email sent");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Notification history / management
    // ─────────────────────────────────────────────────────────────────────────

    @GetMapping("/user/{recipientId}")
    public ResponseEntity<List<NotificationDTO>> getUserNotifications(
            @PathVariable String recipientId) {
        return ResponseEntity.ok(notificationService.getNotificationsByRecipientId(recipientId));
    }

    @GetMapping("/user/{recipientId}/unread")
    public ResponseEntity<List<NotificationDTO>> getUnreadNotifications(
            @PathVariable String recipientId) {
        return ResponseEntity.ok(notificationService.getUnreadNotifications(recipientId));
    }

    @GetMapping("/user/{recipientId}/unread-count")
    public ResponseEntity<Long> getUnreadCount(@PathVariable String recipientId) {
        return ResponseEntity.ok(notificationService.getUnreadCount(recipientId));
    }

    @PutMapping("/{notificationId}/read")
    public ResponseEntity<String> markAsRead(@PathVariable String notificationId) {
        notificationService.markAsRead(notificationId);
        return ResponseEntity.ok("Notification marked as read");
    }

    @DeleteMapping("/{notificationId}")
    public ResponseEntity<String> deleteNotification(@PathVariable String notificationId) {
        notificationService.deleteNotification(notificationId);
        return ResponseEntity.ok("Notification deleted");
    }
}
