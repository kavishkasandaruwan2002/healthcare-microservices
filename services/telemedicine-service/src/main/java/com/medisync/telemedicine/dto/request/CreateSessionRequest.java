package com.medisync.telemedicine.dto.request;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;
@Data public class CreateSessionRequest { @NotNull private String appointmentId; @NotNull private String patientId; @NotNull private String doctorId; @NotNull private LocalDateTime scheduledAt; }
