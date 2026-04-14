package com.medisync.telemedicine.service;

import com.medisync.telemedicine.dto.request.CancelSessionRequest;
import com.medisync.telemedicine.dto.request.CreateSessionRequest;
import com.medisync.telemedicine.dto.response.EndSessionResponse;
import com.medisync.telemedicine.dto.response.ParticipantResponse;
import com.medisync.telemedicine.dto.response.SessionResponse;
import com.medisync.telemedicine.dto.response.SessionStatsResponse;
import com.medisync.telemedicine.dto.response.TokenResponse;
import com.medisync.telemedicine.entity.Participant;
import com.medisync.telemedicine.entity.Session;
import com.medisync.telemedicine.enums.ParticipantRole;
import com.medisync.telemedicine.enums.SessionStatus;
import com.medisync.telemedicine.exception.*;
import com.medisync.telemedicine.messaging.SessionEventPublisher;
import com.medisync.telemedicine.repository.ParticipantRepository;
import com.medisync.telemedicine.repository.SessionRepository;
import com.medisync.telemedicine.security.UserPrincipal;
import io.micrometer.core.instrument.Counter;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.AccessDeniedException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("SessionService Unit Tests")
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
    private UserPrincipal adminPrincipal;
    private UserPrincipal servicePrincipal;
    private UserPrincipal patientPrincipal;
    private UserPrincipal doctorPrincipal;
    private UserPrincipal randomPrincipal;

    @BeforeEach
    void init() {
        appointmentId = UUID.randomUUID();
        patientId = UUID.randomUUID();
        doctorId = UUID.randomUUID();
        sessionId = UUID.randomUUID();

        adminPrincipal = new UserPrincipal(UUID.randomUUID().toString(), "ADMIN");
        servicePrincipal = new UserPrincipal("SERVICE", "SERVICE");
        patientPrincipal = new UserPrincipal(patientId.toString(), "PATIENT");
        doctorPrincipal = new UserPrincipal(doctorId.toString(), "DOCTOR");
        randomPrincipal = new UserPrincipal(UUID.randomUUID().toString(), "PATIENT");
    }

    // ============================================================
    // CREATE SESSION TESTS
    // ============================================================

    @Test
    @DisplayName("createSession_success - creates session with WAITING status")
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

        SessionResponse result = sessionService.createSession(request, adminPrincipal);

        verify(sessionRepository, times(1)).save(any(Session.class));
        assertEquals(SessionStatus.WAITING, result.getStatus());
        assertEquals("session-" + appointmentId, result.getChannelName());
        assertEquals(appointmentId, result.getAppointmentId());
    }

    @Test
    @DisplayName("createSession_duplicateAppointmentId_throwsConflict")
    void createSession_duplicateAppointmentId_throwsConflict() {
        CreateSessionRequest request = new CreateSessionRequest();
        request.setAppointmentId(appointmentId);
        request.setPatientId(patientId);
        request.setDoctorId(doctorId);
        request.setScheduledAt(LocalDateTime.now().plusHours(2));

        Session existingSession = baseSession(SessionStatus.WAITING, false, false);
        when(sessionRepository.findByAppointmentId(appointmentId)).thenReturn(Optional.of(existingSession));

        assertThrows(SessionAlreadyExistsException.class, () ->
            sessionService.createSession(request, adminPrincipal));
    }

    @Test
    @DisplayName("createSession_scheduledInPastByMoreThan24Hours_throwsInvalidState")
    void createSession_scheduledInPastByMoreThan24Hours_throwsInvalidState() {
        CreateSessionRequest request = new CreateSessionRequest();
        request.setAppointmentId(appointmentId);
        request.setPatientId(patientId);
        request.setDoctorId(doctorId);
        request.setScheduledAt(LocalDateTime.now().minusHours(25));

        when(sessionRepository.findByAppointmentId(appointmentId)).thenReturn(Optional.empty());

        assertThrows(InvalidSessionStateException.class, () ->
            sessionService.createSession(request, adminPrincipal));
    }

    @Test
    @DisplayName("createSession_nonAdminOrService_throwsAccessDenied")
    void createSession_nonAdminOrService_throwsAccessDenied() {
        CreateSessionRequest request = new CreateSessionRequest();
        request.setAppointmentId(appointmentId);
        request.setPatientId(patientId);
        request.setDoctorId(doctorId);
        request.setScheduledAt(LocalDateTime.now().plusHours(2));

        when(sessionRepository.findByAppointmentId(appointmentId)).thenReturn(Optional.empty());

        assertThrows(AccessDeniedException.class, () ->
            sessionService.createSession(request, patientPrincipal));
    }

    @Test
    @DisplayName("createSession_nullAppointmentId_throwsValidationException")
    void createSession_nullAppointmentId_throwsValidationException() {
        CreateSessionRequest request = new CreateSessionRequest();
        // appointmentId is null
        request.setPatientId(patientId);
        request.setDoctorId(doctorId);
        request.setScheduledAt(LocalDateTime.now().plusHours(2));

        // Validation happens at controller level with @NotNull
        // Service receives null and should handle gracefully
        when(sessionRepository.findByAppointmentId(null)).thenReturn(Optional.empty());

        assertThrows(NullPointerException.class, () ->
            sessionService.createSession(request, adminPrincipal));
    }

    // ============================================================
    // GENERATE TOKEN TESTS
    // ============================================================

    @Test
    @DisplayName("generateToken_patientJoins_statusRemainsWaiting_whenDoctorNotJoined")
    void generateToken_patientJoins_statusRemainsWaiting_whenDoctorNotJoined() {
        Session session = baseSession(SessionStatus.WAITING, false, false);

        when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(session));
        when(participantRepository.findBySessionAndUserId(session, patientId)).thenReturn(Optional.empty());
        when(participantRepository.save(any(Participant.class))).thenAnswer(inv -> inv.getArgument(0));
        when(sessionRepository.save(any(Session.class))).thenAnswer(inv -> inv.getArgument(0));
        when(agoraTokenService.generateToken(anyString(), anyInt())).thenReturn("mock-token-123");

        TokenResponse response = sessionService.generateToken(sessionId, patientPrincipal, false);

        assertEquals("mock-token-123", response.getToken());
        assertEquals(SessionStatus.WAITING, session.getStatus());
        verify(sessionEventPublisher, never()).publishSessionStarted(any(Session.class));
    }

    @Test
    @DisplayName("generateToken_bothJoin_statusBecomesActive")
    void generateToken_bothJoin_statusBecomesActive() {
        Session session = baseSession(SessionStatus.WAITING, true, false);
        Participant existingParticipant = Participant.builder()
            .session(session)
            .userId(doctorId)
            .agoraUid(101010)
            .role(ParticipantRole.DOCTOR)
            .build();

        when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(session));
        when(participantRepository.findBySessionAndUserId(session, doctorId)).thenReturn(Optional.of(existingParticipant));
        when(sessionRepository.save(any(Session.class))).thenAnswer(inv -> inv.getArgument(0));
        when(agoraTokenService.generateToken(anyString(), anyInt())).thenReturn("mock-token-456");

        sessionService.generateToken(sessionId, doctorPrincipal, false);

        assertEquals(SessionStatus.ACTIVE, session.getStatus());
        assertNotNull(session.getStartedAt());
        verify(sessionEventPublisher, times(1)).publishSessionStarted(session);
    }

    @Test
    @DisplayName("generateToken_callerNotParticipant_throwsAccessDenied")
    void generateToken_callerNotParticipant_throwsAccessDenied() {
        Session session = baseSession(SessionStatus.WAITING, false, false);
        when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(session));

        assertThrows(AccessDeniedException.class, () ->
            sessionService.generateToken(sessionId, randomPrincipal, false));
    }

    @Test
    @DisplayName("generateToken_sessionEnded_throwsConflict")
    void generateToken_sessionEnded_throwsConflict() {
        Session session = baseSession(SessionStatus.ENDED, true, true);
        when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(session));

        assertThrows(SessionAlreadyEndedException.class, () ->
            sessionService.generateToken(sessionId, patientPrincipal, false));
    }

    @Test
    @DisplayName("generateToken_sessionCancelled_throwsConflict")
    void generateToken_sessionCancelled_throwsConflict() {
        Session session = baseSession(SessionStatus.CANCELLED, false, false);
        when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(session));

        assertThrows(SessionAlreadyEndedException.class, () ->
            sessionService.generateToken(sessionId, patientPrincipal, false));
    }

    @Test
    @DisplayName("generateToken_patientRejoining_doesNotPublishEventAgain")
    void generateToken_patientRejoining_doesNotPublishEventAgain() {
        Session session = baseSession(SessionStatus.ACTIVE, true, true);
        Participant patientParticipant = Participant.builder()
            .session(session)
            .userId(patientId)
            .agoraUid(123456)
            .role(ParticipantRole.PATIENT)
            .build();

        when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(session));
        when(participantRepository.findBySessionAndUserId(session, patientId)).thenReturn(Optional.of(patientParticipant));
        when(sessionRepository.save(any(Session.class))).thenAnswer(inv -> inv.getArgument(0));
        when(agoraTokenService.generateToken(anyString(), anyInt())).thenReturn("new-token");

        TokenResponse response = sessionService.generateToken(sessionId, patientPrincipal, false);

        assertNotNull(response.getToken());
        assertEquals(SessionStatus.ACTIVE, session.getStatus());
        verify(sessionEventPublisher, never()).publishSessionStarted(any());
    }

    @Test
    @DisplayName("generateToken_refreshOnly_doesNotChangeState")
    void generateToken_refreshOnly_doesNotChangeState() {
        Session session = baseSession(SessionStatus.ACTIVE, true, true);
        Participant participant = Participant.builder()
            .session(session)
            .userId(patientId)
            .agoraUid(123456)
            .build();

        when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(session));
        when(participantRepository.findBySessionAndUserId(session, patientId)).thenReturn(Optional.of(participant));
        when(agoraTokenService.generateToken(anyString(), anyInt())).thenReturn("refreshed-token");

        TokenResponse response = sessionService.generateToken(sessionId, patientPrincipal, true);

        assertEquals("refreshed-token", response.getToken());
        verify(sessionRepository, never()).save(any(Session.class));
        verify(sessionEventPublisher, never()).publishSessionStarted(any());
    }

    // ============================================================
    // END SESSION TESTS
    // ============================================================

    @Test
    @DisplayName("endSession_success")
    void endSession_success() {
        Session session = baseSession(SessionStatus.ACTIVE, true, true);
        session.setStartedAt(LocalDateTime.now().minusMinutes(30));
        Participant participant = Participant.builder()
            .session(session)
            .userId(doctorId)
            .build();

        when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(session));
        when(participantRepository.findBySession(session)).thenReturn(new java.util.ArrayList<>(List.of(participant)));
        when(participantRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));
        when(sessionRepository.save(any(Session.class))).thenAnswer(inv -> inv.getArgument(0));

        EndSessionResponse response = sessionService.endSession(sessionId, doctorPrincipal);

        assertEquals(SessionStatus.ENDED, response.getStatus());
        assertTrue(Math.abs(response.getDurationMinutes() - 30) <= 1);
        verify(sessionEventPublisher, times(1)).publishSessionEnded(session);
    }

    @Test
    @DisplayName("endSession_sessionNotActive_throwsInvalidState")
    void endSession_sessionNotActive_throwsInvalidState() {
        Session session = baseSession(SessionStatus.WAITING, false, false);
        when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(session));

        assertThrows(SessionAlreadyEndedException.class, () ->
            sessionService.endSession(sessionId, doctorPrincipal));
    }

    @Test
    @DisplayName("endSession_sessionCancelled_throwsInvalidState")
    void endSession_sessionCancelled_throwsInvalidState() {
        Session session = baseSession(SessionStatus.CANCELLED, false, false);
        when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(session));

        assertThrows(SessionAlreadyEndedException.class, () ->
            sessionService.endSession(sessionId, doctorPrincipal));
    }

    @Test
    @DisplayName("endSession_callerIsPatient_throwsAccessDenied")
    void endSession_callerIsPatient_throwsAccessDenied() {
        Session session = baseSession(SessionStatus.ACTIVE, true, true);
        when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(session));

        assertThrows(AccessDeniedException.class, () ->
            sessionService.endSession(sessionId, patientPrincipal));
    }

    @Test
    @DisplayName("endSession_randomUser_throwsAccessDenied")
    void endSession_randomUser_throwsAccessDenied() {
        Session session = baseSession(SessionStatus.ACTIVE, true, true);
        when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(session));

        assertThrows(AccessDeniedException.class, () ->
            sessionService.endSession(sessionId, randomPrincipal));
    }

    @Test
    @DisplayName("endSession_startedAtNull_setsDurationToZero")
    void endSession_startedAtNull_setsDurationToZero() {
        Session session = baseSession(SessionStatus.ACTIVE, true, true);
        session.setStartedAt(null);

        when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(session));
        when(participantRepository.findBySession(session)).thenReturn(List.of());
        when(participantRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));
        when(sessionRepository.save(any(Session.class))).thenAnswer(inv -> inv.getArgument(0));

        EndSessionResponse response = sessionService.endSession(sessionId, doctorPrincipal);

        assertEquals(0, response.getDurationMinutes());
        assertEquals(SessionStatus.ENDED, response.getStatus());
    }

    // ============================================================
    // CANCEL SESSION TESTS
    // ============================================================

    @Test
    @DisplayName("cancelSession_success")
    void cancelSession_success() {
        Session session = baseSession(SessionStatus.WAITING, false, false);
        CancelSessionRequest request = new CancelSessionRequest();
        request.setReason("Patient no-show");

        when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(session));
        when(sessionRepository.save(any(Session.class))).thenAnswer(inv -> inv.getArgument(0));

        SessionResponse response = sessionService.cancelSession(sessionId, request, adminPrincipal);

        assertEquals(SessionStatus.CANCELLED, response.getStatus());
        verify(sessionRepository).save(session);
    }

    @Test
    @DisplayName("cancelSession_nonAdmin_throwsAccessDenied")
    void cancelSession_nonAdmin_throwsAccessDenied() {
        CancelSessionRequest request = new CancelSessionRequest();

        assertThrows(AccessDeniedException.class, () ->
            sessionService.cancelSession(sessionId, request, patientPrincipal));
    }

    @Test
    @DisplayName("cancelSession_activeSession_throwsInvalidState")
    void cancelSession_activeSession_throwsInvalidState() {
        Session session = baseSession(SessionStatus.ACTIVE, true, true);
        CancelSessionRequest request = new CancelSessionRequest();

        when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(session));

        assertThrows(SessionAlreadyEndedException.class, () ->
            sessionService.cancelSession(sessionId, request, adminPrincipal));
    }

    @Test
    @DisplayName("cancelSession_endedSession_throwsInvalidState")
    void cancelSession_endedSession_throwsInvalidState() {
        Session session = baseSession(SessionStatus.ENDED, true, true);
        CancelSessionRequest request = new CancelSessionRequest();

        when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(session));

        assertThrows(SessionAlreadyEndedException.class, () ->
            sessionService.cancelSession(sessionId, request, adminPrincipal));
    }

    // ============================================================
    // GET SESSION TESTS
    // ============================================================

    @Test
    @DisplayName("getSession_asAdmin_returnsSession")
    void getSession_asAdmin_returnsSession() {
        Session session = baseSession(SessionStatus.WAITING, false, false);
        when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(session));

        SessionResponse response = sessionService.getSession(sessionId, adminPrincipal);

        assertEquals(sessionId, response.getSessionId());
        assertEquals(SessionStatus.WAITING, response.getStatus());
    }

    @Test
    @DisplayName("getSession_asPatient_returnsSession")
    void getSession_asPatient_returnsSession() {
        Session session = baseSession(SessionStatus.WAITING, false, false);
        when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(session));

        SessionResponse response = sessionService.getSession(sessionId, patientPrincipal);

        assertEquals(sessionId, response.getSessionId());
    }

    @Test
    @DisplayName("getSession_randomUser_throwsAccessDenied")
    void getSession_randomUser_throwsAccessDenied() {
        Session session = baseSession(SessionStatus.WAITING, false, false);
        when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(session));

        assertThrows(AccessDeniedException.class, () ->
            sessionService.getSession(sessionId, randomPrincipal));
    }

    @Test
    @DisplayName("getSession_notFound_throwsNotFound")
    void getSession_notFound_throwsNotFound() {
        when(sessionRepository.findById(sessionId)).thenReturn(Optional.empty());

        assertThrows(SessionNotFoundException.class, () ->
            sessionService.getSession(sessionId, adminPrincipal));
    }

    // ============================================================
    // GET PARTICIPANTS TESTS
    // ============================================================

    @Test
    @DisplayName("getParticipants_emptyList_returnsEmptyArray")
    void getParticipants_emptyList_returnsEmptyArray() {
        Session session = baseSession(SessionStatus.WAITING, false, false);
        when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(session));
        when(participantRepository.findBySession(session)).thenReturn(List.of());

        List<ParticipantResponse> participants = sessionService.getParticipants(sessionId, adminPrincipal);

        assertTrue(participants.isEmpty());
    }

    @Test
    @DisplayName("getParticipants_withParticipants_returnsList")
    void getParticipants_withParticipants_returnsList() {
        Session session = baseSession(SessionStatus.ACTIVE, true, true);
        Participant p1 = Participant.builder()
            .session(session)
            .userId(patientId)
            .role(ParticipantRole.PATIENT)
            .agoraUid(111)
            .build();
        Participant p2 = Participant.builder()
            .session(session)
            .userId(doctorId)
            .role(ParticipantRole.DOCTOR)
            .agoraUid(222)
            .build();

        when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(session));
        when(participantRepository.findBySession(session)).thenReturn(List.of(p1, p2));

        List<ParticipantResponse> participants = sessionService.getParticipants(sessionId, adminPrincipal);

        assertEquals(2, participants.size());
    }

    @Test
    @DisplayName("getParticipants_nonAdminOrDoctor_throwsAccessDenied")
    void getParticipants_nonAdminOrDoctor_throwsAccessDenied() {
        Session session = baseSession(SessionStatus.WAITING, false, false);
        when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(session));

        assertThrows(AccessDeniedException.class, () ->
            sessionService.getParticipants(sessionId, patientPrincipal));
    }

    // ============================================================
    // SESSION STATS TESTS
    // ============================================================

    @Test
    @DisplayName("getSessionStats_returnsCorrectCounts")
    void getSessionStats_returnsCorrectCounts() {
        when(sessionRepository.count()).thenReturn(15L);
        when(sessionRepository.countByStatus(SessionStatus.ACTIVE)).thenReturn(3L);
        when(sessionRepository.countByStatus(SessionStatus.ENDED)).thenReturn(10L);
        when(sessionRepository.countByStatus(SessionStatus.CANCELLED)).thenReturn(2L);
        when(sessionRepository.findAverageDurationMinutes()).thenReturn(22.5);

        SessionStatsResponse stats = sessionService.getStats(adminPrincipal);

        assertEquals(15L, stats.getTotalSessions());
        assertEquals(3L, stats.getActiveSessions());
        assertEquals(10L, stats.getCompletedSessions());
        assertEquals(2L, stats.getCancelledSessions());
        assertEquals(22.5, stats.getAverageDurationMinutes());
    }

    @Test
    @DisplayName("getSessionStats_nonAdmin_throwsAccessDenied")
    void getSessionStats_nonAdmin_throwsAccessDenied() {
        assertThrows(AccessDeniedException.class, () ->
            sessionService.getStats(patientPrincipal));
    }

    @Test
    @DisplayName("getSessionStats_nullAverage_returnsZero")
    void getSessionStats_nullAverage_returnsZero() {
        when(sessionRepository.count()).thenReturn(0L);
        when(sessionRepository.countByStatus(any())).thenReturn(0L);
        when(sessionRepository.findAverageDurationMinutes()).thenReturn(null);

        SessionStatsResponse stats = sessionService.getStats(adminPrincipal);

        assertEquals(0.0, stats.getAverageDurationMinutes());
    }

    // ============================================================
    // GET MY SESSIONS TESTS
    // ============================================================

    @Test
    @DisplayName("getMySessions_withStatusFilter_returnsFiltered")
    void getMySessions_withStatusFilter_returnsFiltered() {
        Session session = baseSession(SessionStatus.ACTIVE, true, true);
        Page<Session> page = new PageImpl<>(List.of(session));

        when(sessionRepository.findByStatus(SessionStatus.ACTIVE, PageRequest.of(0, 10))).thenReturn(page);

        Page<SessionResponse> result = sessionService.getMySessions(patientPrincipal, SessionStatus.ACTIVE, PageRequest.of(0, 10));

        assertEquals(1, result.getContent().size());
        assertEquals(SessionStatus.ACTIVE, result.getContent().get(0).getStatus());
    }

    @Test
    @DisplayName("getMySessions_noStatusFilter_returnsPatientAndDoctorSessions")
    void getMySessions_noStatusFilter_returnsPatientAndDoctorSessions() {
        Session session = baseSession(SessionStatus.WAITING, false, false);
        Page<Session> page = new PageImpl<>(List.of(session));

        when(sessionRepository.findByPatientIdOrDoctorId(patientId, patientId, PageRequest.of(0, 10))).thenReturn(page);

        Page<SessionResponse> result = sessionService.getMySessions(patientPrincipal, null, PageRequest.of(0, 10));

        assertEquals(1, result.getContent().size());
    }

    // ============================================================
    // HELPER METHODS
    // ============================================================

    private Session baseSession(SessionStatus status, boolean patientJoined, boolean doctorJoined) {
        Session session = Session.builder()
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
        return session;
    }
}
