package com.medisync.telemedicine.dto.response;
import com.medisync.telemedicine.enums.SessionStatus;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class SessionResponse { private UUID sessionId; private String appointmentId; private String patientId; private String doctorId; private String channelName; private SessionStatus status; private String agoraAppId; private LocalDateTime scheduledAt; private LocalDateTime startedAt; private LocalDateTime endedAt; private Integer durationMinutes; private Boolean patientJoined; private Boolean doctorJoined; private LocalDateTime createdAt; private LocalDateTime updatedAt; }
