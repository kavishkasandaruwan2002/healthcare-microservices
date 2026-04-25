package com.medisync.telemedicine.controller;

import com.medisync.telemedicine.dto.request.CancelSessionRequest;
import com.medisync.telemedicine.dto.request.CreateSessionRequest;
import com.medisync.telemedicine.dto.response.*;
import com.medisync.telemedicine.enums.SessionStatus;
import com.medisync.telemedicine.security.UserPrincipal;
import com.medisync.telemedicine.service.SessionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/sessions")
@RequiredArgsConstructor
@Tag(name = "Telemedicine Sessions", description = "Manage video consultation sessions")
public class SessionController {
    private final SessionService sessionService;
    private UserPrincipal principal(Authentication a){ return (UserPrincipal)a.getPrincipal(); }

    @PostMapping("/create") @Operation(summary="Create session", description="Create telemedicine session") @ApiResponse(responseCode="201", description="Created")
    public ResponseEntity<SessionResponse> create(@Valid @RequestBody CreateSessionRequest request, Authentication auth){ return ResponseEntity.status(HttpStatus.CREATED).body(sessionService.createSession(request, principal(auth))); }
    @GetMapping("/{sessionId}") @Operation(summary="Get session", description="Get session by id") @ApiResponse(responseCode="200", description="Success") @ApiResponse(responseCode="403", description="Access denied") @ApiResponse(responseCode="404", description="Session not found")
    public SessionResponse get(@PathVariable UUID sessionId, Authentication auth){ return sessionService.getSession(sessionId, principal(auth)); }
    @GetMapping("/appointment/{appointmentId}") @Operation(summary="Get by appointment", description="Get session by appointment id") @ApiResponse(responseCode="200", description="Success")
    public SessionResponse getByAppointment(@PathVariable String appointmentId, Authentication auth){ return sessionService.getSessionByAppointmentId(appointmentId, principal(auth)); }
    @GetMapping("/my-sessions") @Operation(summary="My sessions", description="List my sessions")
    public Page<SessionResponse> mySessions(@RequestParam(required = false) SessionStatus status, @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "10") int size, Authentication auth){ return sessionService.getMySessions(principal(auth), status, PageRequest.of(page,size)); }
    @GetMapping("/{sessionId}/token") @Operation(summary="Get token", description="Generate Agora token")
    public TokenResponse token(@PathVariable UUID sessionId, Authentication auth){ return sessionService.generateToken(sessionId, principal(auth), false); }
    @GetMapping("/{sessionId}/token/refresh") @Operation(summary="Refresh token", description="Refresh Agora token")
    public TokenResponse refresh(@PathVariable UUID sessionId, Authentication auth){ return sessionService.generateToken(sessionId, principal(auth), true); }
    @PutMapping("/{sessionId}/end") @Operation(summary="End session", description="End active session")
    public EndSessionResponse end(@PathVariable UUID sessionId, Authentication auth){ return sessionService.endSession(sessionId, principal(auth)); }
    @PutMapping("/{sessionId}/cancel") @Operation(summary="Cancel session", description="Cancel waiting session")
    public SessionResponse cancel(@PathVariable UUID sessionId, @RequestBody @Valid CancelSessionRequest request, Authentication auth){ return sessionService.cancelSession(sessionId, request, principal(auth)); }
    @GetMapping @Operation(summary="Admin list sessions", description="List sessions with filters")
    public Page<SessionResponse> all(@RequestParam(required = false) SessionStatus status, @RequestParam(required = false) String doctorId, @RequestParam(required = false) String patientId, @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size, Authentication auth){ return sessionService.getAllSessions(status, doctorId, patientId, PageRequest.of(page,size), principal(auth)); }
    @GetMapping("/{sessionId}/participants") @Operation(summary="List participants", description="Get participants")
    public List<ParticipantResponse> participants(@PathVariable UUID sessionId, Authentication auth){ return sessionService.getParticipants(sessionId, principal(auth)); }
    @GetMapping("/stats") @Operation(summary="Session stats", description="Get aggregated stats")
    public SessionStatsResponse stats(Authentication auth){ return sessionService.getStats(principal(auth)); }
}
