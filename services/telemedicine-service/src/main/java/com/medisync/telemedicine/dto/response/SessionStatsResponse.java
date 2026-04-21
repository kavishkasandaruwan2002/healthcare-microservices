package com.medisync.telemedicine.dto.response;
import lombok.*;
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class SessionStatsResponse { private long totalSessions; private long activeSessions; private long completedSessions; private long cancelledSessions; private double averageDurationMinutes; }
