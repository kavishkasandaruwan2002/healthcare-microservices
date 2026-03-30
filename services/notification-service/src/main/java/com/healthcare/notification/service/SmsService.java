package com.healthcare.notification.service;

import com.healthcare.notification.dto.SmsNotificationRequest;
import com.healthcare.notification.model.Notification;
import com.healthcare.notification.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import com.twilio.Twilio;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;

@Service
@RequiredArgsConstructor
@Slf4j
public class SmsService {

    private final NotificationRepository notificationRepository;

    @Value("${twilio.account-sid}")
    private String accountSid;

    @Value("${twilio.auth-token}")
    private String authToken;

    @Value("${twilio.phone-number}")
    private String twilioPhoneNumber;

    public void sendSms(SmsNotificationRequest request) {
        try {
            Twilio.init(accountSid, authToken);
            Message message = Message.creator(
                    new PhoneNumber(twilioPhoneNumber),
                    new PhoneNumber(request.getPhoneNumber()),
                    request.getMessage()).create();

            // Save notification to database
            Notification notification = Notification.builder()
                    .recipientId(request.getRecipientId())
                    .recipientPhone(request.getPhoneNumber())
                    .notificationType("SMS")
                    .message(request.getMessage())
                    .status("SENT")
                    .isRead(true)
                    .createdAt(System.currentTimeMillis())
                    .sentAt(System.currentTimeMillis())
                    .build();

            notificationRepository.save(notification);
            log.info("SMS sent successfully to: {}", request.getPhoneNumber());
        } catch (Exception e) {
            log.error("Failed to send SMS to: {}", request.getPhoneNumber(), e);
            saveFailedSmsNotification(request, e.getMessage());
        }
    }

    public void sendAppointmentConfirmationSms(String phoneNumber, String recipientId,
            String doctorName, String appointmentDate) {
        String message = "Your appointment with Dr. " + doctorName + " has been confirmed for " +
                appointmentDate + ". Thank you for choosing our platform.";
        sendSms(SmsNotificationRequest.builder()
                .phoneNumber(phoneNumber)
                .recipientId(recipientId)
                .message(message)
                .build());
    }

    private void saveFailedSmsNotification(SmsNotificationRequest request, String failureReason) {
        Notification notification = Notification.builder()
                .recipientId(request.getRecipientId())
                .recipientPhone(request.getPhoneNumber())
                .notificationType("SMS")
                .message(request.getMessage())
                .status("FAILED")
                .isRead(false)
                .failureReason(failureReason)
                .createdAt(System.currentTimeMillis())
                .build();

        notificationRepository.save(notification);
    }
}
