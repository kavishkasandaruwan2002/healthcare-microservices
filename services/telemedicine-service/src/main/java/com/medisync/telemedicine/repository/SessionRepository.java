package com.medisync.telemedicine.repository;

import com.medisync.telemedicine.entity.Session;
import com.medisync.telemedicine.enums.SessionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface SessionRepository extends JpaRepository<Session, UUID> {
    Optional<Session> findByAppointmentId(String appointmentId);
    Page<Session> findByPatientIdOrDoctorId(String patientId, String doctorId, Pageable p);
    @Query("SELECT s FROM Session s WHERE (:status IS NULL OR s.status = :status) AND (s.patientId = :userId OR s.doctorId = :userId)")
    Page<Session> findByStatusAndParticipant(@Param("status") SessionStatus status, @Param("userId") String userId, Pageable pageable);
    Page<Session> findByStatus(SessionStatus status, Pageable p);
    long countByStatus(SessionStatus status);
    @Query("SELECT AVG(s.durationMinutes) FROM Session s WHERE s.status = 'ENDED'")
    Double findAverageDurationMinutes();
    @Query("SELECT s FROM Session s WHERE (:status IS NULL OR s.status = :status) AND (:doctorId IS NULL OR s.doctorId = :doctorId) AND (:patientId IS NULL OR s.patientId = :patientId)")
    Page<Session> findAllWithFilters(@Param("status") SessionStatus status, @Param("doctorId") String doctorId, @Param("patientId") String patientId, Pageable pageable);
}
