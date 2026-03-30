package com.healthcare.notification.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmailNotificationRequest {
    private String to;
    private String subject;
    private String body;
    private String recipientId;
    private String notificationType;
}
