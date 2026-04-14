package com.healthcare.notification.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "notifications")
public class Notification {
    @Id
    private String id;
    private String recipientId;
    private String recipientEmail;
    private String recipientPhone;
    private String notificationType; // EMAIL, SMS, IN_APP
    private String title;
    private String message;
    private String subject;
    private Boolean isRead;
    private String status; // PENDING, SENT, FAILED
    private Long createdAt;
    private Long sentAt;
    private String failureReason;
}
