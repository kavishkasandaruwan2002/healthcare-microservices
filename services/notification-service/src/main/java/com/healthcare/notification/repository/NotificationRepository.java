package com.healthcare.notification.repository;

import com.healthcare.notification.model.Notification;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends MongoRepository<Notification, String> {
    List<Notification> findByRecipientId(String recipientId);

    List<Notification> findByStatus(String status);

    List<Notification> findByRecipientIdAndIsRead(String recipientId, Boolean isRead);
}
