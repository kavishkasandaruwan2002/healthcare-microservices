package com.healthcare.notification.controller;

import com.healthcare.notification.dto.EmailNotificationRequest;
import com.healthcare.notification.dto.NotificationDTO;
import com.healthcare.notification.dto.SmsNotificationRequest;
import com.healthcare.notification.service.EmailService;
import com.healthcare.notification.service.NotificationService;
import com.healthcare.notification.service.SmsService;
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
    private final SmsService smsService;
    private final NotificationService notificationService;

    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("Notification Service is up and running!");
    }

    @PostMapping("/email")
    public ResponseEntity<String> sendEmail(@RequestBody EmailNotificationRequest request) {
        log.info("Sending email to: {}", request.getTo());
        emailService.sendSimpleEmail(request);
        return ResponseEntity.ok("Email sent successfully");
    }

    @PostMapping("/email/appointment-confirmation")
    public ResponseEntity<String> sendAppointmentConfirmation(
            @RequestParam String email,
            @RequestParam String recipientId,
            @RequestParam String doctorName,
            @RequestParam String appointmentDate,
            @RequestParam String appointmentTime) {
        emailService.sendAppointmentConfirmationEmail(email, recipientId, doctorName, appointmentDate, appointmentTime);
        return ResponseEntity.ok("Appointment confirmation email sent");
    }

    @PostMapping("/email/cancellation")
    public ResponseEntity<String> sendCancellationEmail(
            @RequestParam String email,
            @RequestParam String recipientId,
            @RequestParam String reason) {
        emailService.sendCancellationEmail(email, recipientId, reason);
        return ResponseEntity.ok("Cancellation email sent");
    }

    @PostMapping("/email/payment-confirmation")
    public ResponseEntity<String> sendPaymentConfirmation(
            @RequestParam String email,
            @RequestParam String recipientId,
            @RequestParam String transactionId,
            @RequestParam Double amount) {
        emailService.sendPaymentConfirmationEmail(email, recipientId, transactionId, amount);
        return ResponseEntity.ok("Payment confirmation email sent");
    }

    @PostMapping("/sms")
    public ResponseEntity<String> sendSms(@RequestBody SmsNotificationRequest request) {
        log.info("Sending SMS to: {}", request.getPhoneNumber());
        smsService.sendSms(request);
        return ResponseEntity.ok("SMS sent successfully");
    }

    @PostMapping("/sms/appointment-confirmation")
    public ResponseEntity<String> sendAppointmentConfirmationSms(
            @RequestParam String phoneNumber,
            @RequestParam String recipientId,
            @RequestParam String doctorName,
            @RequestParam String appointmentDate) {
        smsService.sendAppointmentConfirmationSms(phoneNumber, recipientId, doctorName, appointmentDate);
        return ResponseEntity.ok("Appointment confirmation SMS sent");
    }

    @GetMapping("/user/{recipientId}")
    public ResponseEntity<List<NotificationDTO>> getUserNotifications(@PathVariable String recipientId) {
        return ResponseEntity.ok(notificationService.getNotificationsByRecipientId(recipientId));
    }

    @GetMapping("/user/{recipientId}/unread")
    public ResponseEntity<List<NotificationDTO>> getUnreadNotifications(@PathVariable String recipientId) {
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
