package com.medisync.telemedicine.repository;

import com.medisync.telemedicine.entity.Participant;
import com.medisync.telemedicine.entity.Session;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ParticipantRepository extends JpaRepository<Participant, UUID> {
    Optional<Participant> findBySessionAndUserId(Session session, String userId);
    List<Participant> findBySession(Session session);
}
