package com.medisync.telemedicine.messaging;

import com.medisync.telemedicine.exception.SessionAlreadyExistsException;
import com.medisync.telemedicine.messaging.event.AppointmentConfirmedEvent;
import com.medisync.telemedicine.service.SessionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Component;

@Component @Slf4j @RequiredArgsConstructor
public class AppointmentEventListener {
    private final SessionService sessionService;
    @RabbitListener(queues = "telemedicine.appointment.confirmed")
    public void onAppointmentConfirmed(@Payload AppointmentConfirmedEvent event){
        try { sessionService.createSessionFromEvent(event); }
        catch (SessionAlreadyExistsException ex){ log.warn("Session already exists for appointment {}", event.getAppointmentId()); }
        catch (Exception ex){ log.error("Failed to process appointment event", ex); }
    }
}
