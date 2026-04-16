package com.medisync.telemedicine.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.medisync.telemedicine.dto.request.CancelSessionRequest;
import com.medisync.telemedicine.dto.request.CreateSessionRequest;
import com.medisync.telemedicine.dto.response.EndSessionResponse;
import com.medisync.telemedicine.dto.response.ParticipantResponse;
import com.medisync.telemedicine.dto.response.SessionResponse;
import com.medisync.telemedicine.dto.response.SessionStatsResponse;
import com.medisync.telemedicine.dto.response.TokenResponse;
import com.medisync.telemedicine.enums.ParticipantRole;
import com.medisync.telemedicine.enums.SessionStatus;
import com.medisync.telemedicine.exception.*;
import com.medisync.telemedicine.security.JwtAuthFilter;
import com.medisync.telemedicine.security.ServiceAuthFilter;
import com.medisync.telemedicine.security.UserPrincipal;
import com.medisync.telemedicine.service.SessionService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.mapping.JpaMetamodelMappingContext;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(SessionController.class)
@DisplayName("SessionController Integration Tests")
class SessionControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;

    @MockBean private SessionService sessionService;
    @MockBean private ServiceAuthFilter serviceAuthFilter;
    @MockBean private JwtAuthFilter jwtAuthFilter;
    @MockBean private JpaMetamodelMappingContext jpaMetamodelMappingContext;

    private UUID sessionId;
    private UUID appointmentId;
    private UUID patientId;
    private UUID doctorId;
    private UserPrincipal adminPrincipal;
    private UserPrincipal patientPrincipal;
    private UserPrincipal doctorPrincipal;
    private UserPrincipal servicePrincipal;

    @BeforeEach
    void setup() throws Exception {
        sessionId = UUID.randomUUID();
        appointmentId = UUID.randomUUID();
        patientId = UUID.randomUUID();
        doctorId = UUID.randomUUID();

        adminPrincipal = new UserPrincipal(UUID.randomUUID().toString(), "ADMIN");
        patientPrincipal = new UserPrincipal(patientId.toString(), "PATIENT");
        doctorPrincipal = new UserPrincipal(doctorId.toString(), "DOCTOR");
        servicePrincipal = new UserPrincipal("SERVICE", "SERVICE");

        doAnswer(invocation -> {
            HttpServletRequest request = invocation.getArgument(0);
            HttpServletResponse response = invocation.getArgument(1);
            FilterChain chain = invocation.getArgument(2);
            chain.doFilter(request, response);
            return null;
        }).when(serviceAuthFilter).doFilter(any(HttpServletRequest.class), any(HttpServletResponse.class), any(FilterChain.class));

        doAnswer(invocation -> {
            HttpServletRequest request = invocation.getArgument(0);
            HttpServletResponse response = invocation.getArgument(1);
            FilterChain chain = invocation.getArgument(2);
            chain.doFilter(request, response);
            return null;
        }).when(jwtAuthFilter).doFilter(any(HttpServletRequest.class), any(HttpServletResponse.class), any(FilterChain.class));
    }

    // ============================================================
    // GET SESSION BY ID TESTS
    // ============================================================

    @Test
    @DisplayName("getSession_asAdmin_returns200")
    void getSession_asAdmin_returns200() throws Exception {
        SessionResponse response = SessionResponse.builder()
            .sessionId(sessionId)
            .appointmentId(appointmentId)
            .patientId(patientId)
            .doctorId(doctorId)
            .status(SessionStatus.WAITING)
            .channelName("session-" + appointmentId)
            .build();

        when(sessionService.getSession(eq(sessionId), any(UserPrincipal.class))).thenReturn(response);

        mockMvc.perform(get("/api/v1/sessions/{id}", sessionId)
                .with(authentication(auth(adminPrincipal))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.sessionId").value(sessionId.toString()))
            .andExpect(jsonPath("$.status").value("WAITING"));
    }

    @Test
    @DisplayName("getSession_asPatient_returns200")
    void getSession_asPatient_returns200() throws Exception {
        SessionResponse response = SessionResponse.builder()
            .sessionId(sessionId)
            .status(SessionStatus.ACTIVE)
            .build();

        when(sessionService.getSession(eq(sessionId), any(UserPrincipal.class))).thenReturn(response);

        mockMvc.perform(get("/api/v1/sessions/{id}", sessionId)
                .with(authentication(auth(patientPrincipal))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.sessionId").value(sessionId.toString()));
    }

    @Test
    @DisplayName("getSession_unauthorized_returns401")
    void getSession_unauthorized_returns401() throws Exception {
        mockMvc.perform(get("/api/v1/sessions/{id}", sessionId))
            .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("getSession_notFound_returns404")
    void getSession_notFound_returns404() throws Exception {
        when(sessionService.getSession(eq(sessionId), any(UserPrincipal.class)))
            .thenThrow(new SessionNotFoundException("Session not found with id: " + sessionId));

        mockMvc.perform(get("/api/v1/sessions/{id}", sessionId)
                .with(authentication(auth(adminPrincipal))))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.error").value("NOT_FOUND"))
            .andExpect(jsonPath("$.message").exists());
    }

    @Test
    @DisplayName("getSession_accessDenied_returns403")
    void getSession_accessDenied_returns403() throws Exception {
        UUID randomUserId = UUID.randomUUID();
        UserPrincipal randomPrincipal = new UserPrincipal(randomUserId.toString(), "PATIENT");

        when(sessionService.getSession(eq(sessionId), any(UserPrincipal.class)))
            .thenThrow(new org.springframework.security.access.AccessDeniedException("Access denied"));

        mockMvc.perform(get("/api/v1/sessions/{id}", sessionId)
                .with(authentication(auth(randomPrincipal))))
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.error").value("FORBIDDEN"));
    }

    // ============================================================
    // GET SESSION BY APPOINTMENT ID TESTS
    // ============================================================

    @Test
    @DisplayName("getSessionByAppointmentId_returns200")
    void getSessionByAppointmentId_returns200() throws Exception {
        SessionResponse response = SessionResponse.builder()
            .sessionId(sessionId)
            .appointmentId(appointmentId)
            .status(SessionStatus.WAITING)
            .build();

        when(sessionService.getSessionByAppointmentId(eq(appointmentId), any(UserPrincipal.class))).thenReturn(response);

        mockMvc.perform(get("/api/v1/sessions/appointment/{id}", appointmentId)
                .with(authentication(auth(adminPrincipal))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.appointmentId").value(appointmentId.toString()));
    }

    @Test
    @DisplayName("getSessionByAppointmentId_notFound_returns404")
    void getSessionByAppointmentId_notFound_returns404() throws Exception {
        when(sessionService.getSessionByAppointmentId(eq(appointmentId), any(UserPrincipal.class)))
            .thenThrow(new SessionNotFoundException("Session not found"));

        mockMvc.perform(get("/api/v1/sessions/appointment/{id}", appointmentId)
                .with(authentication(auth(adminPrincipal))))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.error").value("NOT_FOUND"));
    }

    // ============================================================
    // CREATE SESSION TESTS
    // ============================================================

    @Test
    @DisplayName("createSession_withServiceSecret_returns201")
    void createSession_withServiceSecret_returns201() throws Exception {
        SessionResponse response = SessionResponse.builder()
            .sessionId(sessionId)
            .appointmentId(appointmentId)
            .status(SessionStatus.WAITING)
            .channelName("session-" + appointmentId)
            .build();

        CreateSessionRequest request = new CreateSessionRequest();
        request.setAppointmentId(appointmentId);
        request.setPatientId(patientId);
        request.setDoctorId(doctorId);
        request.setScheduledAt(LocalDateTime.now().plusHours(2));

        when(sessionService.createSession(any(CreateSessionRequest.class), any(UserPrincipal.class)))
            .thenReturn(response);

        mockMvc.perform(post("/api/v1/sessions/create")
                .with(authentication(auth(servicePrincipal)))
                .with(csrf())
                .header("X-Service-Secret", "test-secret")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.sessionId").value(sessionId.toString()))
            .andExpect(jsonPath("$.status").value("WAITING"));
    }

    @Test
    @DisplayName("createSession_duplicateAppointmentId_returns409")
    void createSession_duplicateAppointmentId_returns409() throws Exception {
        CreateSessionRequest request = new CreateSessionRequest();
        request.setAppointmentId(appointmentId);
        request.setPatientId(patientId);
        request.setDoctorId(doctorId);
        request.setScheduledAt(LocalDateTime.now().plusHours(2));

        when(sessionService.createSession(any(CreateSessionRequest.class), any(UserPrincipal.class)))
            .thenThrow(new SessionAlreadyExistsException("Session already exists"));

        mockMvc.perform(post("/api/v1/sessions/create")
                .with(authentication(auth(servicePrincipal)))
                .with(csrf())
                .header("X-Service-Secret", "test-secret")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.error").value("CONFLICT"));
    }

    @Test
    @DisplayName("createSession_invalidScheduledTime_returns400")
    void createSession_invalidScheduledTime_returns400() throws Exception {
        CreateSessionRequest request = new CreateSessionRequest();
        request.setAppointmentId(appointmentId);
        request.setPatientId(patientId);
        request.setDoctorId(doctorId);
        request.setScheduledAt(LocalDateTime.now().minusHours(25));

        when(sessionService.createSession(any(CreateSessionRequest.class), any(UserPrincipal.class)))
            .thenThrow(new InvalidSessionStateException("Scheduled time cannot be more than 24 hours in the past"));

        mockMvc.perform(post("/api/v1/sessions/create")
                .with(authentication(auth(servicePrincipal)))
                .with(csrf())
                .header("X-Service-Secret", "test-secret")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error").exists());
    }

    @Test
    @DisplayName("createSession_nonServiceUser_returns403")
    void createSession_nonServiceUser_returns403() throws Exception {
        CreateSessionRequest request = new CreateSessionRequest();
        request.setAppointmentId(appointmentId);
        request.setPatientId(patientId);
        request.setDoctorId(doctorId);
        request.setScheduledAt(LocalDateTime.now().plusHours(2));

        when(sessionService.createSession(any(CreateSessionRequest.class), any(UserPrincipal.class)))
            .thenThrow(new org.springframework.security.access.AccessDeniedException("Only admin or service can create session"));

        mockMvc.perform(post("/api/v1/sessions/create")
                .with(authentication(auth(patientPrincipal)))
                .with(csrf())
                .header("X-Service-Secret", "test-secret")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.error").value("FORBIDDEN"));
    }

    // ============================================================
    // GET MY SESSIONS TESTS
    // ============================================================

    @Test
    @DisplayName("getMySessions_returns200")
    void getMySessions_returns200() throws Exception {
        SessionResponse response = SessionResponse.builder()
            .sessionId(sessionId)
            .status(SessionStatus.ACTIVE)
            .build();
        Page<SessionResponse> page = new PageImpl<>(List.of(response));

        when(sessionService.getMySessions(any(UserPrincipal.class), isNull(), any(PageRequest.class)))
            .thenReturn(page);

        mockMvc.perform(get("/api/v1/sessions/my-sessions")
                .param("page", "0")
                .param("size", "10")
                .with(authentication(auth(patientPrincipal))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content").isArray())
            .andExpect(jsonPath("$.content[0].sessionId").value(sessionId.toString()));
    }

    @Test
    @DisplayName("getMySessions_withStatusFilter_returns200")
    void getMySessions_withStatusFilter_returns200() throws Exception {
        Page<SessionResponse> page = new PageImpl<>(List.of());

        when(sessionService.getMySessions(any(UserPrincipal.class), eq(SessionStatus.ACTIVE), any(PageRequest.class)))
            .thenReturn(page);

        mockMvc.perform(get("/api/v1/sessions/my-sessions")
                .param("status", "ACTIVE")
                .param("page", "0")
                .param("size", "10")
                .with(authentication(auth(patientPrincipal))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content").isArray());
    }

    // ============================================================
    // GENERATE TOKEN TESTS
    // ============================================================

    @Test
    @DisplayName("generateToken_validPatient_returns200")
    void generateToken_validPatient_returns200() throws Exception {
        TokenResponse response = TokenResponse.builder()
            .token("mock-token-123")
            .channelName("session-" + appointmentId)
            .agoraAppId("agora-app-id")
            .uid(123456)
            .expiresInSeconds(3600)
            .sessionId(sessionId)
            .sessionStatus(SessionStatus.WAITING)
            .build();

        when(sessionService.generateToken(eq(sessionId), any(UserPrincipal.class), eq(false)))
            .thenReturn(response);

        mockMvc.perform(get("/api/v1/sessions/{id}/token", sessionId)
                .with(authentication(auth(patientPrincipal))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.token").value("mock-token-123"))
            .andExpect(jsonPath("$.sessionStatus").value("WAITING"));
    }

    @Test
    @DisplayName("generateToken_sessionEnded_returns409")
    void generateToken_sessionEnded_returns409() throws Exception {
        when(sessionService.generateToken(eq(sessionId), any(UserPrincipal.class), eq(false)))
            .thenThrow(new SessionAlreadyEndedException("Session has already ended"));

        mockMvc.perform(get("/api/v1/sessions/{id}/token", sessionId)
                .with(authentication(auth(patientPrincipal))))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.error").value("CONFLICT"));
    }

    @Test
    @DisplayName("generateToken_sessionCancelled_returns409")
    void generateToken_sessionCancelled_returns409() throws Exception {
        when(sessionService.generateToken(eq(sessionId), any(UserPrincipal.class), eq(false)))
            .thenThrow(new SessionAlreadyEndedException("Cannot join a cancelled session"));

        mockMvc.perform(get("/api/v1/sessions/{id}/token", sessionId)
                .with(authentication(auth(patientPrincipal))))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.error").value("CONFLICT"));
    }

    @Test
    @DisplayName("generateToken_accessDenied_returns403")
    void generateToken_accessDenied_returns403() throws Exception {
        when(sessionService.generateToken(eq(sessionId), any(UserPrincipal.class), eq(false)))
            .thenThrow(new org.springframework.security.access.AccessDeniedException("You are not a participant of this session"));

        mockMvc.perform(get("/api/v1/sessions/{id}/token", sessionId)
                .with(authentication(auth(new UserPrincipal(UUID.randomUUID().toString(), "PATIENT")))))
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.error").value("FORBIDDEN"));
    }

    @Test
    @DisplayName("refreshToken_returns200")
    void refreshToken_returns200() throws Exception {
        TokenResponse response = TokenResponse.builder()
            .token("refreshed-token")
            .sessionId(sessionId)
            .sessionStatus(SessionStatus.ACTIVE)
            .build();

        when(sessionService.generateToken(eq(sessionId), any(UserPrincipal.class), eq(true)))
            .thenReturn(response);

        mockMvc.perform(get("/api/v1/sessions/{id}/token/refresh", sessionId)
                .with(authentication(auth(patientPrincipal))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.token").value("refreshed-token"));
    }

    // ============================================================
    // END SESSION TESTS
    // ============================================================

    @Test
    @DisplayName("endSession_asDoctor_returns200")
    void endSession_asDoctor_returns200() throws Exception {
        EndSessionResponse response = EndSessionResponse.builder()
            .sessionId(sessionId)
            .status(SessionStatus.ENDED)
            .durationMinutes(30)
            .startedAt(LocalDateTime.now().minusMinutes(30))
            .endedAt(LocalDateTime.now())
            .build();

        when(sessionService.endSession(eq(sessionId), any(UserPrincipal.class)))
            .thenReturn(response);

        mockMvc.perform(put("/api/v1/sessions/{id}/end", sessionId)
                .with(authentication(auth(doctorPrincipal)))
                .with(csrf()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("ENDED"))
            .andExpect(jsonPath("$.durationMinutes").value(30));
    }

    @Test
    @DisplayName("endSession_asAdmin_returns200")
    void endSession_asAdmin_returns200() throws Exception {
        EndSessionResponse response = EndSessionResponse.builder()
            .sessionId(sessionId)
            .status(SessionStatus.ENDED)
            .durationMinutes(25)
            .build();

        when(sessionService.endSession(eq(sessionId), any(UserPrincipal.class)))
            .thenReturn(response);

        mockMvc.perform(put("/api/v1/sessions/{id}/end", sessionId)
                .with(authentication(auth(adminPrincipal)))
                .with(csrf()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("ENDED"));
    }

    @Test
    @DisplayName("endSession_asPatient_returns403")
    void endSession_asPatient_returns403() throws Exception {
        when(sessionService.endSession(eq(sessionId), any(UserPrincipal.class)))
            .thenThrow(new org.springframework.security.access.AccessDeniedException("Only assigned doctor or admin can end session"));

        mockMvc.perform(put("/api/v1/sessions/{id}/end", sessionId)
                .with(authentication(auth(patientPrincipal)))
                .with(csrf()))
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.error").value("FORBIDDEN"));
    }

    @Test
    @DisplayName("endSession_sessionNotActive_returns409")
    void endSession_sessionNotActive_returns409() throws Exception {
        when(sessionService.endSession(eq(sessionId), any(UserPrincipal.class)))
            .thenThrow(new SessionAlreadyEndedException("Cannot end a session that was never started"));

        mockMvc.perform(put("/api/v1/sessions/{id}/end", sessionId)
                .with(authentication(auth(doctorPrincipal)))
                .with(csrf()))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.error").value("CONFLICT"));
    }

    @Test
    @DisplayName("endSession_sessionCancelled_returns409")
    void endSession_sessionCancelled_returns409() throws Exception {
        when(sessionService.endSession(eq(sessionId), any(UserPrincipal.class)))
            .thenThrow(new SessionAlreadyEndedException("Cannot end a cancelled session"));

        mockMvc.perform(put("/api/v1/sessions/{id}/end", sessionId)
                .with(authentication(auth(doctorPrincipal)))
                .with(csrf()))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.error").value("CONFLICT"));
    }

    // ============================================================
    // CANCEL SESSION TESTS
    // ============================================================

    @Test
    @DisplayName("cancelSession_asAdmin_returns200")
    void cancelSession_asAdmin_returns200() throws Exception {
        SessionResponse response = SessionResponse.builder()
            .sessionId(sessionId)
            .status(SessionStatus.CANCELLED)
            .build();

        CancelSessionRequest request = new CancelSessionRequest();
        request.setReason("Patient no-show");

        when(sessionService.cancelSession(eq(sessionId), any(CancelSessionRequest.class), any(UserPrincipal.class)))
            .thenReturn(response);

        mockMvc.perform(put("/api/v1/sessions/{id}/cancel", sessionId)
                .with(authentication(auth(adminPrincipal)))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("CANCELLED"));
    }

    @Test
    @DisplayName("cancelSession_asPatient_returns403")
    void cancelSession_asPatient_returns403() throws Exception {
        CancelSessionRequest request = new CancelSessionRequest();
        request.setReason("Not admin");

        when(sessionService.cancelSession(eq(sessionId), any(CancelSessionRequest.class), any(UserPrincipal.class)))
            .thenThrow(new org.springframework.security.access.AccessDeniedException("Admin only"));

        mockMvc.perform(put("/api/v1/sessions/{id}/cancel", sessionId)
                .with(authentication(auth(patientPrincipal)))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.error").value("FORBIDDEN"));
    }

    @Test
    @DisplayName("cancelSession_activeSession_returns409")
    void cancelSession_activeSession_returns409() throws Exception {
        CancelSessionRequest request = new CancelSessionRequest();
        request.setReason("Test");

        when(sessionService.cancelSession(eq(sessionId), any(CancelSessionRequest.class), any(UserPrincipal.class)))
            .thenThrow(new SessionAlreadyEndedException("Cannot cancel an ongoing session. End it first."));

        mockMvc.perform(put("/api/v1/sessions/{id}/cancel", sessionId)
                .with(authentication(auth(adminPrincipal)))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.error").value("CONFLICT"));
    }

    // ============================================================
    // ADMIN LIST SESSIONS TESTS
    // ============================================================

    @Test
    @DisplayName("getAllSessions_asAdmin_returns200")
    void getAllSessions_asAdmin_returns200() throws Exception {
        SessionResponse response = SessionResponse.builder()
            .sessionId(sessionId)
            .status(SessionStatus.ACTIVE)
            .build();
        Page<SessionResponse> page = new PageImpl<>(List.of(response));

        when(sessionService.getAllSessions(isNull(), isNull(), isNull(), any(PageRequest.class), any(UserPrincipal.class)))
            .thenReturn(page);

        mockMvc.perform(get("/api/v1/sessions")
                .param("page", "0")
                .param("size", "20")
                .with(authentication(auth(adminPrincipal))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content").isArray())
            .andExpect(jsonPath("$.content[0].sessionId").value(sessionId.toString()));
    }

    @Test
    @DisplayName("getAllSessions_asPatient_returns403")
    void getAllSessions_asPatient_returns403() throws Exception {
        when(sessionService.getAllSessions(any(), any(), any(), any(), any()))
            .thenThrow(new org.springframework.security.access.AccessDeniedException("Admin only"));

        mockMvc.perform(get("/api/v1/sessions")
                .with(authentication(auth(patientPrincipal))))
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.error").value("FORBIDDEN"));
    }

    // ============================================================
    // GET PARTICIPANTS TESTS
    // ============================================================

    @Test
    @DisplayName("getParticipants_asAdmin_returns200")
    void getParticipants_asAdmin_returns200() throws Exception {
        ParticipantResponse p1 = ParticipantResponse.builder()
            .participantId(UUID.randomUUID())
            .userId(patientId)
            .role(ParticipantRole.PATIENT)
            .agoraUid(123456)
            .build();
        ParticipantResponse p2 = ParticipantResponse.builder()
            .participantId(UUID.randomUUID())
            .userId(doctorId)
            .role(ParticipantRole.DOCTOR)
            .agoraUid(789012)
            .build();

        when(sessionService.getParticipants(eq(sessionId), any(UserPrincipal.class)))
            .thenReturn(List.of(p1, p2));

        mockMvc.perform(get("/api/v1/sessions/{id}/participants", sessionId)
                .with(authentication(auth(adminPrincipal))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$").isArray())
            .andExpect(jsonPath("$.length()").value(2));
    }

    @Test
    @DisplayName("getParticipants_emptyList_returns200")
    void getParticipants_emptyList_returns200() throws Exception {
        when(sessionService.getParticipants(eq(sessionId), any(UserPrincipal.class)))
            .thenReturn(List.of());

        mockMvc.perform(get("/api/v1/sessions/{id}/participants", sessionId)
                .with(authentication(auth(adminPrincipal))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$").isArray())
            .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    @DisplayName("getParticipants_asDoctor_returns200")
    void getParticipants_asDoctor_returns200() throws Exception {
        when(sessionService.getParticipants(eq(sessionId), any(UserPrincipal.class)))
            .thenReturn(List.of());

        mockMvc.perform(get("/api/v1/sessions/{id}/participants", sessionId)
                .with(authentication(auth(doctorPrincipal))))
            .andExpect(status().isOk());
    }

    @Test
    @DisplayName("getParticipants_asPatient_returns403")
    void getParticipants_asPatient_returns403() throws Exception {
        when(sessionService.getParticipants(eq(sessionId), any(UserPrincipal.class)))
            .thenThrow(new org.springframework.security.access.AccessDeniedException("Access denied"));

        mockMvc.perform(get("/api/v1/sessions/{id}/participants", sessionId)
                .with(authentication(auth(patientPrincipal))))
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.error").value("FORBIDDEN"));
    }

    // ============================================================
    // SESSION STATS TESTS
    // ============================================================

    @Test
    @DisplayName("getStats_asAdmin_returns200")
    void getStats_asAdmin_returns200() throws Exception {
        SessionStatsResponse response = SessionStatsResponse.builder()
            .totalSessions(15L)
            .activeSessions(3L)
            .completedSessions(10L)
            .cancelledSessions(2L)
            .averageDurationMinutes(22.5)
            .build();

        when(sessionService.getStats(any(UserPrincipal.class)))
            .thenReturn(response);

        mockMvc.perform(get("/api/v1/sessions/stats")
                .with(authentication(auth(adminPrincipal))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.totalSessions").value(15))
            .andExpect(jsonPath("$.activeSessions").value(3))
            .andExpect(jsonPath("$.completedSessions").value(10))
            .andExpect(jsonPath("$.cancelledSessions").value(2))
            .andExpect(jsonPath("$.averageDurationMinutes").value(22.5));
    }

    @Test
    @DisplayName("getStats_asPatient_returns403")
    void getStats_asPatient_returns403() throws Exception {
        when(sessionService.getStats(any(UserPrincipal.class)))
            .thenThrow(new org.springframework.security.access.AccessDeniedException("Admin only"));

        mockMvc.perform(get("/api/v1/sessions/stats")
                .with(authentication(auth(patientPrincipal))))
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.error").value("FORBIDDEN"));
    }

    // ============================================================
    // ERROR CASES
    // ============================================================

    @Test
    @DisplayName("getNonExistentSession_returns404")
    void getNonExistentSession_returns404() throws Exception {
        UUID nonExistentId = UUID.randomUUID();
        when(sessionService.getSession(eq(nonExistentId), any(UserPrincipal.class)))
            .thenThrow(new SessionNotFoundException("Session not found"));

        mockMvc.perform(get("/api/v1/sessions/{id}", nonExistentId)
                .with(authentication(auth(adminPrincipal))))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.error").value("NOT_FOUND"))
            .andExpect(jsonPath("$.message").exists());
    }

    @Test
    @DisplayName("invalidRequestBody_returns400")
    void invalidRequestBody_returns400() throws Exception {
        // Missing required fields
        String invalidBody = "{}";

        mockMvc.perform(post("/api/v1/sessions/create")
                .with(authentication(auth(servicePrincipal)))
                .with(csrf())
                .header("X-Service-Secret", "test-secret")
                .contentType(MediaType.APPLICATION_JSON)
                .content(invalidBody))
            .andExpect(status().isBadRequest());
    }

    // ============================================================
    // HELPER METHODS
    // ============================================================

    private UsernamePasswordAuthenticationToken auth(UserPrincipal principal) {
        return new UsernamePasswordAuthenticationToken(principal, null,
            List.of(new SimpleGrantedAuthority("ROLE_" + principal.getRole())));
    }
}
