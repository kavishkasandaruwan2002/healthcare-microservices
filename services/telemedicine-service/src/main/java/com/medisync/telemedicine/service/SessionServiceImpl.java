package com.medisync.telemedicine.service;

import com.medisync.telemedicine.dto.request.CancelSessionRequest;
import com.medisync.telemedicine.dto.request.CreateSessionRequest;
import com.medisync.telemedicine.dto.response.*;
import com.medisync.telemedicine.entity.Participant;
import com.medisync.telemedicine.entity.Session;
import com.medisync.telemedicine.enums.ParticipantRole;
import com.medisync.telemedicine.enums.SessionStatus;
import com.medisync.telemedicine.exception.*;
import com.medisync.telemedicine.messaging.SessionEventPublisher;
import com.medisync.telemedicine.messaging.event.AppointmentConfirmedEvent;
import com.medisync.telemedicine.repository.ParticipantRepository;
import com.medisync.telemedicine.repository.SessionRepository;
import com.medisync.telemedicine.security.UserPrincipal;
import io.micrometer.core.instrument.Counter;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

@Service @RequiredArgsConstructor
public class SessionServiceImpl implements SessionService {
    private final SessionRepository sessionRepository;
    private final ParticipantRepository participantRepository;
    private final AgoraTokenService agoraTokenService;
    private final SessionEventPublisher sessionEventPublisher;
    private final Counter sessionsCreatedCounter;
    private final Counter tokensGeneratedCounter;
    private final Counter sessionsEndedCounter;

    @Override
    @Transactional
    public SessionResponse createSession(CreateSessionRequest req, UserPrincipal principal) {
        if(sessionRepository.findByAppointmentId(req.getAppointmentId()).isPresent()) throw new SessionAlreadyExistsException("Session already exists for appointmentId: " + req.getAppointmentId());
        if(principal == null || (!principal.isAdmin() && !"SERVICE".equals(principal.getRole()))) throw new AccessDeniedException("Only admin or service can create session");
        if (req.getScheduledAt().isBefore(LocalDateTime.now().minusHours(24))) {
            throw new InvalidSessionStateException("Scheduled time cannot be more than 24 hours in the past");
        }
        Session s = sessionRepository.save(Session.builder().appointmentId(req.getAppointmentId()).patientId(req.getPatientId()).doctorId(req.getDoctorId()).channelName("session-"+req.getAppointmentId()).status(SessionStatus.WAITING).agoraAppId(agoraTokenService.getAppId()).scheduledAt(req.getScheduledAt()).build());
        sessionsCreatedCounter.increment();
        return toResponse(s);
    }

    @Override
    public SessionResponse createSessionFromEvent(AppointmentConfirmedEvent event) {
        return createSession(new CreateSessionRequest(){ { setAppointmentId(event.getAppointmentId()); setPatientId(event.getPatientId()); setDoctorId(event.getDoctorId()); setScheduledAt(event.getScheduledAt()); } }, new UserPrincipal("SERVICE","SERVICE"));
    }

    @Override public SessionResponse getSession(UUID sessionId, UserPrincipal p){ Session s=getById(sessionId); authorizeAccess(s,p,false); return toResponse(s); }
    @Override public SessionResponse getSessionByAppointmentId(UUID appointmentId, UserPrincipal p){ Session s=sessionRepository.findByAppointmentId(appointmentId).orElseThrow(() -> new SessionNotFoundException("Session not found with appointment id: "+appointmentId)); authorizeAccess(s,p,false); return toResponse(s); }
    @Override public Page<SessionResponse> getMySessions(UserPrincipal p, SessionStatus status, Pageable pageable){ if(status!=null) return sessionRepository.findByStatus(status,pageable).map(this::toResponse); UUID uid=UUID.fromString(p.getUserId()); return sessionRepository.findByPatientIdOrDoctorId(uid,uid,pageable).map(this::toResponse); }

    @Override
    @Transactional
    public TokenResponse generateToken(UUID sessionId, UserPrincipal p, boolean refreshOnly) {
        Session s = getById(sessionId);
        assertCallerIsParticipant(s, p.getUserId());
        if (!refreshOnly && s.getStatus() == SessionStatus.CANCELLED) {
            throw new SessionAlreadyEndedException("Cannot join a cancelled session");
        }
        if (!refreshOnly && s.getStatus() == SessionStatus.ENDED) {
            throw new SessionAlreadyEndedException("Session has already ended");
        }
        if(!refreshOnly && s.getStatus()!=SessionStatus.WAITING && s.getStatus()!=SessionStatus.ACTIVE) throw new InvalidSessionStateException("Session status does not allow token generation");
        UUID uid = UUID.fromString(p.getUserId());
        Participant participant = participantRepository.findBySessionAndUserId(s, uid).orElseGet(() -> participantRepository.save(Participant.builder().session(s).userId(uid).role(uid.equals(s.getDoctorId())?ParticipantRole.DOCTOR:ParticipantRole.PATIENT).joinedAt(LocalDateTime.now()).agoraUid(ThreadLocalRandom.current().nextInt(100000,999999)).build()));
        String token = agoraTokenService.generateToken(s.getChannelName(), participant.getAgoraUid());
        tokensGeneratedCounter.increment();
        if(!refreshOnly){
            boolean patientWasJoined = Boolean.TRUE.equals(s.getPatientJoined());
            boolean doctorWasJoined = Boolean.TRUE.equals(s.getDoctorJoined());
            if(uid.equals(s.getPatientId())) s.setPatientJoined(true);
            if(uid.equals(s.getDoctorId())) s.setDoctorJoined(true);
            boolean callerRejoinedWithoutStateChange =
                    (uid.equals(s.getPatientId()) && patientWasJoined) ||
                    (uid.equals(s.getDoctorId()) && doctorWasJoined);
            if(!callerRejoinedWithoutStateChange && Boolean.TRUE.equals(s.getPatientJoined()) && Boolean.TRUE.equals(s.getDoctorJoined()) && s.getStatus()==SessionStatus.WAITING){ s.setStatus(SessionStatus.ACTIVE); s.setStartedAt(LocalDateTime.now()); sessionEventPublisher.publishSessionStarted(s); }
            sessionRepository.save(s);
        }
        return TokenResponse.builder().token(token).channelName(s.getChannelName()).agoraAppId(s.getAgoraAppId()).uid(participant.getAgoraUid()).expiresInSeconds(3600).sessionId(s.getSessionId()).sessionStatus(s.getStatus()).build();
    }

    @Override
    @Transactional
    public EndSessionResponse endSession(UUID sessionId, UserPrincipal p) {
        Session s = getById(sessionId);
        if(!(p.isAdmin() || (p.isDoctor() && UUID.fromString(p.getUserId()).equals(s.getDoctorId())))) throw new AccessDeniedException("Only assigned doctor or admin can end session");
        if (s.getStatus() == SessionStatus.WAITING) {
            throw new SessionAlreadyEndedException("Cannot end a session that was never started");
        }
        if (s.getStatus() == SessionStatus.CANCELLED) {
            throw new SessionAlreadyEndedException("Cannot end a cancelled session");
        }
        if(s.getStatus()!=SessionStatus.ACTIVE) throw new InvalidSessionStateException("Only active session can be ended");
        s.setStatus(SessionStatus.ENDED);
        s.setEndedAt(LocalDateTime.now());
        s.setDurationMinutes(s.getStartedAt() == null ? 0 : (int) ChronoUnit.MINUTES.between(s.getStartedAt(), s.getEndedAt()));
        List<Participant> parts = participantRepository.findBySession(s); parts.forEach(x -> x.setLeftAt(s.getEndedAt())); participantRepository.saveAll(parts);
        sessionRepository.save(s); sessionEventPublisher.publishSessionEnded(s); sessionsEndedCounter.increment();
        return EndSessionResponse.builder().sessionId(s.getSessionId()).status(s.getStatus()).startedAt(s.getStartedAt()).endedAt(s.getEndedAt()).durationMinutes(s.getDurationMinutes()).build();
    }

    @Override
    @Transactional
    public SessionResponse cancelSession(UUID sessionId, CancelSessionRequest request, UserPrincipal p) {
        if(!p.isAdmin()) throw new AccessDeniedException("Admin only");
        Session s=getById(sessionId);
        if (s.getStatus() == SessionStatus.ACTIVE) {
            throw new SessionAlreadyEndedException("Cannot cancel an ongoing session. End it first.");
        }
        if (s.getStatus() == SessionStatus.ENDED) {
            throw new SessionAlreadyEndedException("Cannot cancel a completed session");
        }
        if(s.getStatus()!=SessionStatus.WAITING) throw new InvalidSessionStateException("Only waiting session can be cancelled");
        s.setStatus(SessionStatus.CANCELLED);
        return toResponse(sessionRepository.save(s));
    }

    @Override public Page<SessionResponse> getAllSessions(SessionStatus status, UUID doctorId, UUID patientId, Pageable pageable, UserPrincipal p){ if(!p.isAdmin()) throw new AccessDeniedException("Admin only"); return sessionRepository.findAllWithFilters(status,doctorId,patientId,pageable).map(this::toResponse); }
    @Override public List<ParticipantResponse> getParticipants(UUID sessionId, UserPrincipal p){ Session s=getById(sessionId); if(!(p.isAdmin() || (p.isDoctor() && UUID.fromString(p.getUserId()).equals(s.getDoctorId())))) throw new AccessDeniedException("Access denied"); return participantRepository.findBySession(s).stream().map(this::toParticipantResponse).toList(); }
    @Override public SessionStatsResponse getStats(UserPrincipal p){ if(!p.isAdmin()) throw new AccessDeniedException("Admin only"); Double avg=sessionRepository.findAverageDurationMinutes(); return SessionStatsResponse.builder().totalSessions(sessionRepository.count()).activeSessions(sessionRepository.countByStatus(SessionStatus.ACTIVE)).completedSessions(sessionRepository.countByStatus(SessionStatus.ENDED)).cancelledSessions(sessionRepository.countByStatus(SessionStatus.CANCELLED)).averageDurationMinutes(avg==null?0.0:avg).build(); }

    private Session getById(UUID id){ return sessionRepository.findById(id).orElseThrow(() -> new SessionNotFoundException("Session not found with id: " + id)); }
    private void authorizeAccess(Session s, UserPrincipal p, boolean doctorOnly){
        if(p.isAdmin()) return;
        UUID uid=UUID.fromString(p.getUserId());
        if(doctorOnly && !uid.equals(s.getDoctorId())) throw new AccessDeniedException("Access denied");
        assertCallerIsParticipant(s, p.getUserId());
    }
    private void assertCallerIsParticipant(Session session, String callerId){
        UUID uid = UUID.fromString(callerId);
        if(!uid.equals(session.getPatientId()) && !uid.equals(session.getDoctorId())) {
            throw new AccessDeniedException("You are not a participant of this session");
        }
    }
    private SessionResponse toResponse(Session s){ return SessionResponse.builder().sessionId(s.getSessionId()).appointmentId(s.getAppointmentId()).patientId(s.getPatientId()).doctorId(s.getDoctorId()).channelName(s.getChannelName()).status(s.getStatus()).agoraAppId(s.getAgoraAppId()).scheduledAt(s.getScheduledAt()).startedAt(s.getStartedAt()).endedAt(s.getEndedAt()).durationMinutes(s.getDurationMinutes()).patientJoined(s.getPatientJoined()).doctorJoined(s.getDoctorJoined()).createdAt(s.getCreatedAt()).updatedAt(s.getUpdatedAt()).build(); }
    private ParticipantResponse toParticipantResponse(Participant p){ return ParticipantResponse.builder().participantId(p.getParticipantId()).userId(p.getUserId()).role(p.getRole()).joinedAt(p.getJoinedAt()).leftAt(p.getLeftAt()).agoraUid(p.getAgoraUid()).build(); }
}
