package com.medisync.telemedicine.client.dto;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;
@Data public class AppointmentDetails { private UUID appointmentId; private UUID patientId; private UUID doctorId; private LocalDateTime scheduledAt; private String status; }
