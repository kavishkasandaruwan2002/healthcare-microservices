package com.healthcare.notification.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationDTO {
    private String id;
    private String recipientId;
    private String recipientEmail;
    private String title;
    private String message;
    private Boolean isRead;
    private String status;
    private Long createdAt;
}
