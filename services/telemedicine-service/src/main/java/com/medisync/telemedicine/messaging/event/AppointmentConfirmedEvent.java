package com.medisync.telemedicine.messaging.event;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;
@Data public class AppointmentConfirmedEvent { private UUID appointmentId; private UUID patientId; private UUID doctorId; private LocalDateTime scheduledAt; }
