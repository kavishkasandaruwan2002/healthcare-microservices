package com.medisync.telemedicine.dto.request;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;
@Data public class CreateSessionRequest { @NotNull private UUID appointmentId; @NotNull private UUID patientId; @NotNull private UUID doctorId; @NotNull private LocalDateTime scheduledAt; }
