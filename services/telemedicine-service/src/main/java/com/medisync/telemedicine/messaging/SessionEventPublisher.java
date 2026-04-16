package com.medisync.telemedicine.messaging;

import com.medisync.telemedicine.entity.Session;
import com.medisync.telemedicine.messaging.event.SessionEventPayload;
import lombok.RequiredArgsConstructor;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

@Component @RequiredArgsConstructor
public class SessionEventPublisher {
    private final RabbitTemplate rabbitTemplate;
    public void publishSessionStarted(Session s){ rabbitTemplate.convertAndSend("telemedicine.exchange", "session.started", toPayload(s)); }
    public void publishSessionEnded(Session s){ rabbitTemplate.convertAndSend("telemedicine.exchange", "session.ended", toPayload(s)); }
    private SessionEventPayload toPayload(Session s){ return SessionEventPayload.builder().sessionId(s.getSessionId()).appointmentId(s.getAppointmentId()).patientId(s.getPatientId()).doctorId(s.getDoctorId()).status(s.getStatus()).startedAt(s.getStartedAt()).endedAt(s.getEndedAt()).durationMinutes(s.getDurationMinutes()).build(); }
}
