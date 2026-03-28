package com.healthcare.notification.service;

import com.healthcare.notification.dto.NotificationDTO;
import com.healthcare.notification.model.Notification;
import com.healthcare.notification.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public List<NotificationDTO> getNotificationsByRecipientId(String recipientId) {
        return notificationRepository.findByRecipientId(recipientId)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public List<NotificationDTO> getUnreadNotifications(String recipientId) {
        return notificationRepository.findByRecipientIdAndIsRead(recipientId, false)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public void markAsRead(String notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));
        notification.setIsRead(true);
        notificationRepository.save(notification);
        log.info("Notification marked as read: {}", notificationId);
    }

    public void deleteNotification(String notificationId) {
        notificationRepository.deleteById(notificationId);
        log.info("Notification deleted: {}", notificationId);
    }

    public long getUnreadCount(String recipientId) {
        return notificationRepository.findByRecipientIdAndIsRead(recipientId, false).size();
    }

    private NotificationDTO mapToDTO(Notification notification) {
        return NotificationDTO.builder()
                .id(notification.getId())
                .recipientId(notification.getRecipientId())
                .recipientEmail(notification.getRecipientEmail())
                .title(notification.getTitle())
                .message(notification.getMessage())
                .isRead(notification.getIsRead())
                .status(notification.getStatus())
                .createdAt(notification.getCreatedAt())
                .build();
    }
}
