package com.medisync.telemedicine.messaging.event;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;
@Data public class AppointmentConfirmedEvent { private String appointmentId; private String patientId; private String doctorId; private LocalDateTime scheduledAt; }
