package com.medisync.telemedicine.controller;

import com.medisync.telemedicine.dto.response.EndSessionResponse;
import com.medisync.telemedicine.dto.response.SessionResponse;
import com.medisync.telemedicine.dto.response.TokenResponse;
import com.medisync.telemedicine.config.SecurityConfig;
import com.medisync.telemedicine.enums.SessionStatus;
import com.medisync.telemedicine.exception.GlobalExceptionHandler;
import com.medisync.telemedicine.exception.SessionNotFoundException;
import com.medisync.telemedicine.security.JwtAuthFilter;
import com.medisync.telemedicine.security.ServiceAuthFilter;
import com.medisync.telemedicine.security.UserPrincipal;
import com.medisync.telemedicine.service.SessionService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(SessionController.class)
@Import({GlobalExceptionHandler.class, SecurityConfig.class})
class SessionControllerTest {

    @Autowired private MockMvc mockMvc;

    @MockBean private SessionService sessionService;
    @MockBean private ServiceAuthFilter serviceAuthFilter;
    @MockBean private JwtAuthFilter jwtAuthFilter;
    @MockBean private org.springframework.data.jpa.mapping.JpaMetamodelMappingContext jpaMetamodelMappingContext;

    @BeforeEach
    void setupFilters() throws Exception {
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

    @Test
    void getSession_asAdmin_returns200() throws Exception {
        UUID id = UUID.randomUUID();
        when(sessionService.getSession(eq(id), any(UserPrincipal.class))).thenReturn(SessionResponse.builder().sessionId(id).status(SessionStatus.WAITING).build());

        mockMvc.perform(get("/api/v1/sessions/{id}", id).with(authentication(auth("ADMIN", UUID.randomUUID().toString()))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sessionId").value(id.toString()));
    }

    @Test
    void getSession_unauthorized_returns403() throws Exception {
        mockMvc.perform(get("/api/v1/sessions/{id}", UUID.randomUUID()))
                .andExpect(status().is4xxClientError());
    }

    @Test
    void getSession_notFound_returns404() throws Exception {
        UUID id = UUID.randomUUID();
        when(sessionService.getSession(eq(id), any(UserPrincipal.class))).thenThrow(new SessionNotFoundException("Session not found with id: " + id));

        mockMvc.perform(get("/api/v1/sessions/{id}", id).with(authentication(auth("ADMIN", UUID.randomUUID().toString()))))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("NOT_FOUND"));
    }

    @Test
    void createSession_withServiceSecret_returns201() throws Exception {
        UUID appointmentId = UUID.randomUUID();
        when(sessionService.createSession(any(), any(UserPrincipal.class))).thenReturn(SessionResponse.builder().sessionId(UUID.randomUUID()).appointmentId(appointmentId).status(SessionStatus.WAITING).build());

        String body = """
            {
              "appointmentId":"%s",
              "patientId":"%s",
              "doctorId":"%s",
              "scheduledAt":"%s"
            }
            """.formatted(appointmentId, UUID.randomUUID(), UUID.randomUUID(), LocalDateTime.now().plusHours(1));

        mockMvc.perform(post("/api/v1/sessions/create")
                        .with(authentication(auth("SERVICE", "SERVICE")))
                        .with(csrf())
                        .header("X-Service-Secret", "test-secret")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated());
    }

    @Test
    void generateToken_validPatient_returns200() throws Exception {
        UUID id = UUID.randomUUID();
        when(sessionService.generateToken(eq(id), any(UserPrincipal.class), eq(false)))
                .thenReturn(TokenResponse.builder().token("mock-token").sessionId(id).sessionStatus(SessionStatus.WAITING).build());

        mockMvc.perform(get("/api/v1/sessions/{id}/token", id).with(authentication(auth("PATIENT", UUID.randomUUID().toString()))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("mock-token"));
    }

    @Test
    void endSession_asDoctor_returns200() throws Exception {
        UUID id = UUID.randomUUID();
        when(sessionService.endSession(eq(id), any(UserPrincipal.class))).thenReturn(EndSessionResponse.builder().sessionId(id).status(SessionStatus.ENDED).build());

        mockMvc.perform(put("/api/v1/sessions/{id}/end", id).with(authentication(auth("DOCTOR", UUID.randomUUID().toString()))).with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ENDED"));
    }

    @Test
    void endSession_asPatient_returns403() throws Exception {
        UUID id = UUID.randomUUID();
        when(sessionService.endSession(eq(id), any(UserPrincipal.class))).thenThrow(new org.springframework.security.access.AccessDeniedException("Access denied"));

        mockMvc.perform(put("/api/v1/sessions/{id}/end", id).with(authentication(auth("PATIENT", UUID.randomUUID().toString()))).with(csrf()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("FORBIDDEN"));
    }

    private UsernamePasswordAuthenticationToken auth(String role, String userId) {
        return new UsernamePasswordAuthenticationToken(new UserPrincipal(userId, role), null, List.of());
    }
}
