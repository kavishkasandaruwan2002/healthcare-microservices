package com.medisync.telemedicine.entity;

import com.medisync.telemedicine.enums.SessionStatus;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "tele_sessions")
@EntityListeners(AuditingEntityListener.class)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Session {
    @Id @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID sessionId;
    @Column(unique = true, nullable = false)
    private UUID appointmentId;
    @Column(nullable = false)
    private UUID patientId;
    @Column(nullable = false)
    private UUID doctorId;
    @Column(unique = true, nullable = false)
    private String channelName;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SessionStatus status;
    private String agoraAppId;
    @Column(nullable = false)
    private LocalDateTime scheduledAt;
    private LocalDateTime startedAt;
    private LocalDateTime endedAt;
    private Integer durationMinutes;
    @Builder.Default @Column(columnDefinition = "boolean default false")
    private Boolean patientJoined = false;
    @Builder.Default @Column(columnDefinition = "boolean default false")
    private Boolean doctorJoined = false;
    @CreatedDate @Column(updatable = false)
    private LocalDateTime createdAt;
    @LastModifiedDate
    private LocalDateTime updatedAt;
}
