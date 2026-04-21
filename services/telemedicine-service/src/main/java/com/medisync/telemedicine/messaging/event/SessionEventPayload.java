package com.medisync.telemedicine.messaging.event;
import com.medisync.telemedicine.enums.SessionStatus;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class SessionEventPayload { private UUID sessionId; private UUID appointmentId; private UUID patientId; private UUID doctorId; private SessionStatus status; private LocalDateTime startedAt; private LocalDateTime endedAt; private Integer durationMinutes; }
