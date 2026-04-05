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
        kafkaTemplate.send("appointment.created", event);
    }

    public void publishCancelledEvent(AppointmentEvent event) {
        log.info("Publishing AppointmentCancelled event for ID: {}", event.getAppointmentId());
        kafkaTemplate.send("appointment.cancelled", event);
    }

    public void publishCompletedEvent(AppointmentEvent event) {
        log.info("Publishing AppointmentCompleted event for ID: {}", event.getAppointmentId());
        kafkaTemplate.send("appointment.completed", event);
    }
}
