package com.medisync.telemedicine.dto.response;
import com.medisync.telemedicine.enums.SessionStatus;
import lombok.*;
import java.util.UUID;
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class TokenResponse { private String token; private String channelName; private String agoraAppId; private Integer uid; private long expiresInSeconds; private UUID sessionId; private SessionStatus sessionStatus; }
