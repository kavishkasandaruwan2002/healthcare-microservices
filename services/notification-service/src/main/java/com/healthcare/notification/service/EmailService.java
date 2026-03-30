package com.healthcare.notification.service;

import com.healthcare.notification.dto.EmailNotificationRequest;
import com.healthcare.notification.model.Notification;
import com.healthcare.notification.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import javax.mail.MessagingException;
import javax.mail.internet.MimeMessage;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;
    private final NotificationRepository notificationRepository;

    public void sendSimpleEmail(EmailNotificationRequest request) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(request.getTo());
            message.setSubject(request.getSubject());
            message.setText(request.getBody());
            message.setFrom("peirisayodya369@gmail.com");

            mailSender.send(message);

            // Save notification to database
            Notification notification = Notification.builder()
                    .recipientId(request.getRecipientId())
                    .recipientEmail(request.getTo())
                    .notificationType("EMAIL")
                    .title(request.getSubject())
                    .message(request.getBody())
                    .subject(request.getSubject())
                    .status("SENT")
                    .isRead(false)
                    .createdAt(System.currentTimeMillis())
                    .sentAt(System.currentTimeMillis())
                    .build();

            notificationRepository.save(notification);
            log.info("Email sent successfully to: {}", request.getTo());
        } catch (Exception e) {
            log.error("Failed to send email to: {}", request.getTo(), e);
            saveFailedNotification(request, e.getMessage());
        }
    }

    public void sendHtmlEmail(EmailNotificationRequest request, String htmlContent) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);

            helper.setTo(request.getTo());
            helper.setSubject(request.getSubject());
            helper.setText(htmlContent, true);
            helper.setFrom("peirisayodya369@gmail.com");

            mailSender.send(message);

            // Save notification to database
            Notification notification = Notification.builder()
                    .recipientId(request.getRecipientId())
                    .recipientEmail(request.getTo())
                    .notificationType("EMAIL")
                    .title(request.getSubject())
                    .message(request.getBody())
                    .subject(request.getSubject())
                    .status("SENT")
                    .isRead(false)
                    .createdAt(System.currentTimeMillis())
                    .sentAt(System.currentTimeMillis())
                    .build();

            notificationRepository.save(notification);
            log.info("HTML Email sent successfully to: {}", request.getTo());
        } catch (MessagingException e) {
            log.error("Failed to send HTML email to: {}", request.getTo(), e);
            saveFailedNotification(request, e.getMessage());
        }
    }

    public void sendAppointmentConfirmationEmail(String recipientEmail, String recipientId,
            String doctorName, String appointmentDate,
            String appointmentTime) {
        String htmlContent = "<html><body>" +
                "<h2>Appointment Confirmation</h2>" +
                "<p>Dear Patient,</p>" +
                "<p>Your appointment has been successfully booked!</p>" +
                "<p><strong>Doctor:</strong> " + doctorName + "</p>" +
                "<p><strong>Date:</strong> " + appointmentDate + "</p>" +
                "<p><strong>Time:</strong> " + appointmentTime + "</p>" +
                "<p>Please arrive 10 minutes early. If you need to reschedule, please contact us as soon as possible.</p>"
                +
                "<p>Best regards,<br/>Healthcare Platform Team</p>" +
                "</body></html>";

        EmailNotificationRequest request = EmailNotificationRequest.builder()
                .to(recipientEmail)
                .recipientId(recipientId)
                .subject("Appointment Confirmation")
                .body("Your appointment with " + doctorName + " has been confirmed for " + appointmentDate + " at "
                        + appointmentTime)
                .notificationType("EMAIL")
                .build();

        sendHtmlEmail(request, htmlContent);
    }

    public void sendCancellationEmail(String recipientEmail, String recipientId, String reason) {
        String htmlContent = "<html><body>" +
                "<h2>Appointment Cancellation</h2>" +
                "<p>Dear Patient,</p>" +
                "<p>Your appointment has been cancelled.</p>" +
                "<p><strong>Reason:</strong> " + reason + "</p>" +
                "<p>Please book another appointment at your convenience.</p>" +
                "<p>Best regards,<br/>Healthcare Platform Team</p>" +
                "</body></html>";

        EmailNotificationRequest request = EmailNotificationRequest.builder()
                .to(recipientEmail)
                .recipientId(recipientId)
                .subject("Appointment Cancellation")
                .body("Your appointment has been cancelled. Reason: " + reason)
                .notificationType("EMAIL")
                .build();

        sendHtmlEmail(request, htmlContent);
    }

    public void sendPaymentConfirmationEmail(String recipientEmail, String recipientId,
            String transactionId, Double amount) {
        String htmlContent = "<html><body>" +
                "<h2>Payment Confirmation</h2>" +
                "<p>Dear Patient,</p>" +
                "<p>Your payment has been successfully processed.</p>" +
                "<p><strong>Transaction ID:</strong> " + transactionId + "</p>" +
                "<p><strong>Amount:</strong> Rs. " + amount + "</p>" +
                "<p>An receipt has been attached to this email.</p>" +
                "<p>Best regards,<br/>Healthcare Platform Team</p>" +
                "</body></html>";

        EmailNotificationRequest request = EmailNotificationRequest.builder()
                .to(recipientEmail)
                .recipientId(recipientId)
                .subject("Payment Confirmation")
                .body("Payment of Rs. " + amount + " has been confirmed. Transaction ID: " + transactionId)
                .notificationType("EMAIL")
                .build();

        sendHtmlEmail(request, htmlContent);
    }

    private void saveFailedNotification(EmailNotificationRequest request, String failureReason) {
        Notification notification = Notification.builder()
                .recipientId(request.getRecipientId())
                .recipientEmail(request.getTo())
                .notificationType("EMAIL")
                .title(request.getSubject())
                .message(request.getBody())
                .subject(request.getSubject())
                .status("FAILED")
                .isRead(false)
                .failureReason(failureReason)
                .createdAt(System.currentTimeMillis())
                .build();

        notificationRepository.save(notification);
    }
}
