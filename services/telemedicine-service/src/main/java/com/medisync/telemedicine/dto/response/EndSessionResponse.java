package com.medisync.telemedicine.dto.response;
import com.medisync.telemedicine.enums.SessionStatus;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class EndSessionResponse { private UUID sessionId; private SessionStatus status; private LocalDateTime startedAt; private LocalDateTime endedAt; private Integer durationMinutes; }
