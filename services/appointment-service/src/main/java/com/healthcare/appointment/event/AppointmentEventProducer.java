package com.healthcare.appointment.event;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class AppointmentEventProducer {

    private final KafkaTemplate<String, AppointmentEvent> kafkaTemplate;

    public void publishCreatedEvent(AppointmentEvent event) {
        log.info("Publishing AppointmentCreated event for ID: {}", event.getAppointmentId());
        safeSend("appointment.created", event);
    }

    public void publishConfirmedEvent(AppointmentEvent event) {
        log.info("Publishing AppointmentConfirmed event for ID: {}", event.getAppointmentId());
        safeSend("appointment.confirmed", event);
    }

    public void publishCancelledEvent(AppointmentEvent event) {
        log.info("Publishing AppointmentCancelled event for ID: {}", event.getAppointmentId());
        safeSend("appointment.cancelled", event);
    }

    public void publishCompletedEvent(AppointmentEvent event) {
        log.info("Publishing AppointmentCompleted event for ID: {}", event.getAppointmentId());
        safeSend("appointment.completed", event);
    }

    /** Generic publish — picks the right topic based on event type */
    public void publishEvent(AppointmentEvent event) {
        switch (event.getType()) {
            case "CONFIRMED":
                publishConfirmedEvent(event);
                break;
            case "CANCELLED":
                publishCancelledEvent(event);
                break;
            case "COMPLETED":
                publishCompletedEvent(event);
                break;
            default:
                publishCreatedEvent(event);
                break;
        }
    }

    private void safeSend(String topic, AppointmentEvent event) {
        try {
            kafkaTemplate.send(topic, event);
        } catch (Exception e) {
            log.error("Failed to publish event to topic {} for appointment {}: {}",
                    topic, event.getAppointmentId(), e.getMessage());
            // Kafka failure must NOT crash the appointment workflow
        }
    }
}

