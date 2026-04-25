package com.medisync.telemedicine.service;

import com.medisync.telemedicine.dto.request.CancelSessionRequest;
import com.medisync.telemedicine.dto.request.CreateSessionRequest;
import com.medisync.telemedicine.dto.response.*;
import com.medisync.telemedicine.enums.SessionStatus;
import com.medisync.telemedicine.messaging.event.AppointmentConfirmedEvent;
import com.medisync.telemedicine.security.UserPrincipal;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface SessionService {
    SessionResponse createSession(CreateSessionRequest request, UserPrincipal principal);
    SessionResponse createSessionFromEvent(AppointmentConfirmedEvent event);
    SessionResponse getSession(UUID sessionId, UserPrincipal principal);
    SessionResponse getSessionByAppointmentId(String appointmentId, UserPrincipal principal);
    Page<SessionResponse> getMySessions(UserPrincipal principal, SessionStatus status, Pageable pageable);
    TokenResponse generateToken(UUID sessionId, UserPrincipal principal, boolean refreshOnly);
    EndSessionResponse endSession(UUID sessionId, UserPrincipal principal);
    SessionResponse cancelSession(UUID sessionId, CancelSessionRequest request, UserPrincipal principal);
    Page<SessionResponse> getAllSessions(SessionStatus status, String doctorId, String patientId, Pageable pageable, UserPrincipal principal);
    List<ParticipantResponse> getParticipants(UUID sessionId, UserPrincipal principal);
    SessionStatsResponse getStats(UserPrincipal principal);
}
