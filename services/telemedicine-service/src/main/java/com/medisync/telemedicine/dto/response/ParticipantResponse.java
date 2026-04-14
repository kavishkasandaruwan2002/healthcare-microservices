package com.medisync.telemedicine.dto.response;
import com.medisync.telemedicine.enums.ParticipantRole;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ParticipantResponse { private UUID participantId; private UUID userId; private ParticipantRole role; private LocalDateTime joinedAt; private LocalDateTime leftAt; private Integer agoraUid; }
