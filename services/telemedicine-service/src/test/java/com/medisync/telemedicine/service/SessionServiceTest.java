package com.medisync.telemedicine.service;

import com.medisync.telemedicine.dto.request.CreateSessionRequest;
import com.medisync.telemedicine.dto.response.EndSessionResponse;
import com.medisync.telemedicine.dto.response.SessionResponse;
import com.medisync.telemedicine.dto.response.SessionStatsResponse;
import com.medisync.telemedicine.dto.response.TokenResponse;
import com.medisync.telemedicine.entity.Participant;
import com.medisync.telemedicine.entity.Session;
import com.medisync.telemedicine.enums.SessionStatus;
import com.medisync.telemedicine.exception.SessionAlreadyEndedException;
import com.medisync.telemedicine.exception.SessionAlreadyExistsException;
import com.medisync.telemedicine.messaging.SessionEventPublisher;
import com.medisync.telemedicine.repository.ParticipantRepository;
import com.medisync.telemedicine.repository.SessionRepository;
import com.medisync.telemedicine.security.UserPrincipal;
import io.micrometer.core.instrument.Counter;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SessionServiceTest {

    @Mock private SessionRepository sessionRepository;
    @Mock private ParticipantRepository participantRepository;
    @Mock private AgoraTokenService agoraTokenService;
    @Mock private SessionEventPublisher sessionEventPublisher;
    @Mock private Counter sessionsCreatedCounter;
    @Mock private Counter tokensGeneratedCounter;
    @Mock private Counter sessionsEndedCounter;

    @InjectMocks private SessionServiceImpl sessionService;

    private UUID appointmentId;
    private UUID patientId;
    private UUID doctorId;
    private UUID sessionId;

    @org.junit.jupiter.api.BeforeEach
    void init() {
        appointmentId = UUID.randomUUID();
        patientId = UUID.randomUUID();
        doctorId = UUID.randomUUID();
        sessionId = UUID.randomUUID();
    }

    @Test
    void createSession_success() {
        CreateSessionRequest request = new CreateSessionRequest();
        request.setAppointmentId(appointmentId);
        request.setPatientId(patientId);
        request.setDoctorId(doctorId);
        request.setScheduledAt(LocalDateTime.now().plusHours(2));

        when(sessionRepository.findByAppointmentId(appointmentId)).thenReturn(Optional.empty());
        when(agoraTokenService.getAppId()).thenReturn("agora-app-id");
        when(sessionRepository.save(any(Session.class))).thenAnswer(inv -> {
            Session s = inv.getArgument(0);
            s.setSessionId(sessionId);
            return s;
        });

        SessionResponse result = sessionService.createSession(request, new UserPrincipal("admin", "ADMIN"));

        verify(sessionRepository, times(1)).save(any(Session.class));
        assertEquals(SessionStatus.WAITING, result.getStatus());
        assertEquals("session-" + appointmentId, result.getChannelName());
    }

    @Test
    void createSession_duplicateAppointmentId_throwsConflict() {
        CreateSessionRequest request = new CreateSessionRequest();
        request.setAppointmentId(appointmentId);
        request.setPatientId(patientId);
        request.setDoctorId(doctorId);
        request.setScheduledAt(LocalDateTime.now().plusHours(2));

        when(sessionRepository.findByAppointmentId(appointmentId)).thenReturn(Optional.of(baseSession(SessionStatus.WAITING, false, false)));

        assertThrows(SessionAlreadyExistsException.class, () -> sessionService.createSession(request, new UserPrincipal("admin", "ADMIN")));
    }

    @Test
    void generateToken_patientJoins_statusRemainsWaiting_whenDoctorNotJoined() {
        Session session = baseSession(SessionStatus.WAITING, false, false);
        UserPrincipal caller = new UserPrincipal(patientId.toString(), "PATIENT");

        when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(session));
        when(participantRepository.findBySessionAndUserId(session, patientId)).thenReturn(Optional.empty());
        when(participantRepository.save(any(Participant.class))).thenAnswer(inv -> inv.getArgument(0));
        when(sessionRepository.save(any(Session.class))).thenAnswer(inv -> inv.getArgument(0));
        when(agoraTokenService.generateToken(anyString(), anyInt())).thenReturn("mock-token-123");

        TokenResponse response = sessionService.generateToken(sessionId, caller, false);

        assertEquals("mock-token-123", response.getToken());
        assertEquals(SessionStatus.WAITING, session.getStatus());
        verify(sessionEventPublisher, never()).publishSessionStarted(any(Session.class));
    }

    @Test
    void generateToken_bothJoin_statusBecomesActive() {
        Session session = baseSession(SessionStatus.WAITING, true, false);
        UserPrincipal caller = new UserPrincipal(doctorId.toString(), "DOCTOR");
        Participant existing = Participant.builder().session(session).userId(doctorId).agoraUid(101010).build();

        when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(session));
        when(participantRepository.findBySessionAndUserId(session, doctorId)).thenReturn(Optional.of(existing));
        when(sessionRepository.save(any(Session.class))).thenAnswer(inv -> inv.getArgument(0));
        when(agoraTokenService.generateToken(anyString(), anyInt())).thenReturn("mock-token-456");

        sessionService.generateToken(sessionId, caller, false);

        assertEquals(SessionStatus.ACTIVE, session.getStatus());
        assertNotNull(session.getStartedAt());
        verify(sessionEventPublisher, times(1)).publishSessionStarted(session);
    }

    @Test
    void generateToken_callerNotParticipant_throwsAccessDenied() {
        Session session = baseSession(SessionStatus.WAITING, false, false);
        UserPrincipal caller = new UserPrincipal(UUID.randomUUID().toString(), "PATIENT");
        when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(session));

        assertThrows(AccessDeniedException.class, () -> sessionService.generateToken(sessionId, caller, false));
    }

    @Test
    void generateToken_sessionEnded_throwsConflict() {
        Session session = baseSession(SessionStatus.ENDED, true, true);
        UserPrincipal caller = new UserPrincipal(patientId.toString(), "PATIENT");
        when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(session));

        assertThrows(SessionAlreadyEndedException.class, () -> sessionService.generateToken(sessionId, caller, false));
    }

    @Test
    void endSession_success() {
        Session session = baseSession(SessionStatus.ACTIVE, true, true);
        session.setStartedAt(LocalDateTime.now().minusMinutes(30));

        when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(session));
        when(participantRepository.findBySession(session)).thenReturn(List.of());
        when(participantRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));
        when(sessionRepository.save(any(Session.class))).thenAnswer(inv -> inv.getArgument(0));

        EndSessionResponse response = sessionService.endSession(sessionId, new UserPrincipal(doctorId.toString(), "DOCTOR"));

        assertEquals(SessionStatus.ENDED, response.getStatus());
        assertTrue(Math.abs(response.getDurationMinutes() - 30) <= 1);
        verify(sessionEventPublisher, times(1)).publishSessionEnded(session);
    }

    @Test
    void endSession_sessionNotActive_throwsInvalidState() {
        Session session = baseSession(SessionStatus.WAITING, false, false);
        when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(session));

        assertThrows(SessionAlreadyEndedException.class, () -> sessionService.endSession(sessionId, new UserPrincipal(doctorId.toString(), "DOCTOR")));
    }

    @Test
    void endSession_callerIsPatient_throwsAccessDenied() {
        Session session = baseSession(SessionStatus.ACTIVE, true, true);
        when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(session));

        assertThrows(AccessDeniedException.class, () -> sessionService.endSession(sessionId, new UserPrincipal(patientId.toString(), "PATIENT")));
    }

    @Test
    void getSessionStats_returnsCorrectCounts() {
        when(sessionRepository.count()).thenReturn(15L);
        when(sessionRepository.countByStatus(SessionStatus.ACTIVE)).thenReturn(3L);
        when(sessionRepository.countByStatus(SessionStatus.ENDED)).thenReturn(10L);
        when(sessionRepository.countByStatus(SessionStatus.CANCELLED)).thenReturn(2L);
        when(sessionRepository.findAverageDurationMinutes()).thenReturn(22.5);

        SessionStatsResponse stats = sessionService.getStats(new UserPrincipal("admin", "ADMIN"));

        assertEquals(15L, stats.getTotalSessions());
        assertEquals(3L, stats.getActiveSessions());
        assertEquals(10L, stats.getCompletedSessions());
        assertEquals(2L, stats.getCancelledSessions());
        assertEquals(22.5, stats.getAverageDurationMinutes());
    }

    private Session baseSession(SessionStatus status, boolean patientJoined, boolean doctorJoined) {
        return Session.builder()
                .sessionId(sessionId)
                .appointmentId(appointmentId)
                .patientId(patientId)
                .doctorId(doctorId)
                .channelName("session-" + appointmentId)
                .status(status)
                .agoraAppId("agora-app-id")
                .scheduledAt(LocalDateTime.now().plusHours(1))
                .patientJoined(patientJoined)
                .doctorJoined(doctorJoined)
                .build();
    }
}
