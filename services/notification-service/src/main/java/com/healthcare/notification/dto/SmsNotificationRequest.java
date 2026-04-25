package com.healthcare.notification.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SmsNotificationRequest {
    private String phoneNumber;
    private String message;
    private String recipientId;
}
