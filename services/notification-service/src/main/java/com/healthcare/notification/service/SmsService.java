package com.healthcare.notification.service;

/**
 * SMS service has been disabled. All notifications are now sent via email.
 * This class is kept as a stub to avoid compilation errors if referenced elsewhere.
 * @deprecated Use {@link EmailService} instead.
 */
@org.springframework.stereotype.Service
@lombok.extern.slf4j.Slf4j
public class SmsService {

    /**
     * SMS sending is disabled. This is a no-op stub.
     */
    public void sendSms(com.healthcare.notification.dto.SmsNotificationRequest request) {
        log.warn("SMS service is disabled. SMS to {} was not sent. Use email notifications instead.",
                request.getPhoneNumber());
    }

    /**
     * SMS sending is disabled. This is a no-op stub.
     */
    public void sendAppointmentConfirmationSms(String phoneNumber, String recipientId,
            String doctorName, String appointmentDate) {
        log.warn("SMS service is disabled. SMS to {} was not sent. Use email notifications instead.",
                phoneNumber);
    }
}
