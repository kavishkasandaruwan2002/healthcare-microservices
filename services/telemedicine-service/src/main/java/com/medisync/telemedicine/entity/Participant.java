package com.medisync.telemedicine.entity;

import com.medisync.telemedicine.enums.ParticipantRole;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "tele_participants")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Participant {
    @Id @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID participantId;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id")
    private Session session;
    @Column(nullable = false)
    private UUID userId;
    @Enumerated(EnumType.STRING)
    private ParticipantRole role;
    private LocalDateTime joinedAt;
    private LocalDateTime leftAt;
    private Integer agoraUid;
}
