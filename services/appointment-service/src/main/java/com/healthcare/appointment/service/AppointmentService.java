package com.healthcare.appointment.service;

import com.healthcare.appointment.client.ExternalServiceClient;
import com.healthcare.appointment.client.NotificationServiceClient;
import com.healthcare.appointment.dto.AppointmentBookingRequest;
import com.healthcare.appointment.dto.AppointmentRequest;
import com.healthcare.appointment.dto.AppointmentResponse;
import com.healthcare.appointment.entity.Appointment;
import com.healthcare.appointment.entity.AppointmentStatus;
import com.healthcare.appointment.event.AppointmentEvent;
import com.healthcare.appointment.event.AppointmentEventProducer;
import com.healthcare.appointment.mapper.AppointmentMapper;
import com.healthcare.appointment.repository.AppointmentRepository;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final AppointmentMapper appointmentMapper;
    private final AppointmentEventProducer eventProducer;
    private final ExternalServiceClient externalServiceClient;
    private final NotificationServiceClient notificationServiceClient;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("MMMM dd, yyyy");
    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("hh:mm a");

    // ─────────────────────────────────────────────────────────────────────────
    // Create Appointment (frontend booking format — date + time strings)
    // ─────────────────────────────────────────────────────────────────────────

    public AppointmentResponse createAppointmentFromBooking(AppointmentBookingRequest request) {
        log.info("Creating appointment from booking request for patient {} with doctor {}",
                request.getPatientId(), request.getDoctorId());

        // Fetch patient and doctor details from their services
        Map<String, Object> patientDetails = externalServiceClient.getPatientDetails(request.getPatientId());
        Map<String, Object> doctorDetails  = externalServiceClient.getDoctorDetails(request.getDoctorId());

        // Map to entity
        Appointment appointment = appointmentMapper.toEntity(request);

        // Enrich with patient data (only if available)
        String patientName  = "";
        String patientEmail = "";
        String patientPhone = "";
        if (!patientDetails.isEmpty()) {
            patientName  = safeStr(patientDetails.get("name"));
            patientEmail = safeStr(patientDetails.get("email"));
            patientPhone = safeStr(patientDetails.getOrDefault("phone", ""));
            appointment.setPatientName(patientName);
            appointment.setPatientEmail(patientEmail);
            appointment.setPatientPhone(patientPhone);
        }

        // Enrich with doctor data (only if available)
        String doctorName           = "";
        String doctorEmail          = "";
        String doctorSpecialization = "";
        if (!doctorDetails.isEmpty()) {
            doctorName           = safeStr(doctorDetails.get("name"));
            doctorEmail          = safeStr(doctorDetails.get("email"));
            doctorSpecialization = safeStr(doctorDetails.getOrDefault("specialization", ""));
            appointment.setDoctorName(doctorName);
            appointment.setDoctorEmail(doctorEmail);
            appointment.setDoctorSpecialization(doctorSpecialization);
        }

        // Check for time conflicts
        LocalDateTime start = appointment.getAppointmentTime();
        LocalDateTime end   = start.plusMinutes(appointment.getDurationMinutes());
        List<Appointment> conflicts = appointmentRepository.findConflicts(request.getDoctorId(), start, end);
        if (!conflicts.isEmpty()) {
            log.warn("Conflict detected for doctor {} at {}", request.getDoctorId(), start);
            throw new RuntimeException("Doctor already has an appointment during this time!");
        }

        // Save
        appointment = appointmentRepository.save(appointment);
        log.info("Appointment created successfully with ID: {}", appointment.getId());

        // Publish Kafka event
        publishAppointmentEvent(appointment, "CREATED");

        // Send booking confirmation email to patient (non-blocking)
        if (patientEmail != null && !patientEmail.isBlank()) {
            notificationServiceClient.sendAppointmentConfirmationEmail(
                    patientEmail,
                    appointment.getPatientId(),
                    patientName,
                    doctorName,
                    doctorSpecialization,
                    formatDate(appointment.getAppointmentTime()),
                    formatTime(appointment.getAppointmentTime())
            );
        }

        return appointmentMapper.toResponse(appointment);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Create Appointment (LocalDateTime format)
    // ─────────────────────────────────────────────────────────────────────────

    public AppointmentResponse createAppointment(AppointmentRequest request) {
        log.info("Creating appointment for patient {} with doctor {}",
                request.getPatientId(), request.getDoctorId());

        Appointment appointment = appointmentMapper.toEntity(request);

        // Enrich with patient data
        Map<String, Object> patientDetails = externalServiceClient.getPatientDetails(request.getPatientId());
        String patientName  = "";
        String patientEmail = "";
        if (!patientDetails.isEmpty()) {
            patientName  = safeStr(patientDetails.get("name"));
            patientEmail = safeStr(patientDetails.get("email"));
            appointment.setPatientName(patientName);
            appointment.setPatientEmail(patientEmail);
            appointment.setPatientPhone(safeStr(patientDetails.getOrDefault("phone", "")));
        }

        // Enrich with doctor data
        Map<String, Object> doctorDetails = externalServiceClient.getDoctorDetails(request.getDoctorId());
        String doctorName           = "";
        String doctorSpecialization = "";
        if (!doctorDetails.isEmpty()) {
            doctorName           = safeStr(doctorDetails.get("name"));
            doctorSpecialization = safeStr(doctorDetails.getOrDefault("specialization", ""));
            appointment.setDoctorName(doctorName);
            appointment.setDoctorEmail(safeStr(doctorDetails.get("email")));
            appointment.setDoctorSpecialization(doctorSpecialization);
        }

        appointment = appointmentRepository.save(appointment);
        log.info("Appointment created with ID: {}", appointment.getId());

        publishAppointmentEvent(appointment, "CREATED");

        // Send booking confirmation email to patient
        if (patientEmail != null && !patientEmail.isBlank()) {
            notificationServiceClient.sendAppointmentConfirmationEmail(
                    patientEmail,
                    appointment.getPatientId(),
                    patientName,
                    doctorName,
                    doctorSpecialization,
                    formatDate(appointment.getAppointmentTime()),
                    formatTime(appointment.getAppointmentTime())
            );
        }

        return appointmentMapper.toResponse(appointment);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Get Patient Appointments
    // ─────────────────────────────────────────────────────────────────────────

    public List<AppointmentResponse> getPatientAppointments(String patientId) {
        log.info("Fetching appointments for patient: {}", patientId);
        return appointmentRepository.findByPatientId(patientId).stream()
                .map(appointmentMapper::toResponse)
                .collect(Collectors.toList());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Get Doctor Appointments (with circuit breaker)
    // ─────────────────────────────────────────────────────────────────────────

    @CircuitBreaker(name = "doctorService", fallbackMethod = "getDoctorAppointmentsFallback")
    public List<AppointmentResponse> getDoctorAppointments(String doctorId) {
        log.info("Fetching appointments for doctor: {}", doctorId);
        return appointmentRepository.findByDoctorId(doctorId).stream()
                .map(appointmentMapper::toResponse)
                .collect(Collectors.toList());
    }

    public List<AppointmentResponse> getDoctorAppointmentsFallback(String doctorId, Throwable t) {
        log.warn("Falling back for doctor appointments due to: {}", t.getMessage());
        return appointmentRepository.findByDoctorId(doctorId).stream()
                .map(appointmentMapper::toResponse)
                .collect(Collectors.toList());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Confirm Appointment
    // ─────────────────────────────────────────────────────────────────────────

    public AppointmentResponse confirmAppointment(String id) {
        log.info("Confirming appointment: {}", id);
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Appointment not found: " + id));
        appointment.setStatus(AppointmentStatus.CONFIRMED);
        appointment = appointmentRepository.save(appointment);

        // Publish Kafka event (to the correct topic)
        publishAppointmentEvent(appointment, "CONFIRMED");

        // Send confirmation email to patient
        if (appointment.getPatientEmail() != null && !appointment.getPatientEmail().isBlank()) {
            notificationServiceClient.sendAppointmentConfirmationEmail(
                    appointment.getPatientEmail(),
                    appointment.getPatientId(),
                    appointment.getPatientName(),
                    appointment.getDoctorName(),
                    appointment.getDoctorSpecialization(),
                    formatDate(appointment.getAppointmentTime()),
                    formatTime(appointment.getAppointmentTime())
            );
        }

        return appointmentMapper.toResponse(appointment);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Cancel Appointment
    // ─────────────────────────────────────────────────────────────────────────

    public AppointmentResponse cancelAppointment(String id) {
        log.info("Cancelling appointment: {}", id);
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Appointment not found: " + id));
        appointment.setStatus(AppointmentStatus.CANCELLED);
        appointment = appointmentRepository.save(appointment);

        // Publish Kafka event (to the correct topic)
        publishAppointmentEvent(appointment, "CANCELLED");

        // Send cancellation email to patient
        if (appointment.getPatientEmail() != null && !appointment.getPatientEmail().isBlank()) {
            notificationServiceClient.sendAppointmentCancellationEmail(
                    appointment.getPatientEmail(),
                    appointment.getPatientId(),
                    appointment.getPatientName(),
                    appointment.getDoctorName(),
                    formatDate(appointment.getAppointmentTime()),
                    formatTime(appointment.getAppointmentTime()),
                    "Your appointment has been cancelled."
            );
        }

        return appointmentMapper.toResponse(appointment);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Complete Appointment
    // ─────────────────────────────────────────────────────────────────────────

    public AppointmentResponse completeAppointment(String id, String prescription) {
        log.info("Completing appointment: {}", id);
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Appointment not found: " + id));
        appointment.setStatus(AppointmentStatus.COMPLETED);
        appointment.setPrescription(prescription);
        appointment = appointmentRepository.save(appointment);

        // Publish Kafka event (to the correct topic)
        publishAppointmentEvent(appointment, "COMPLETED");

        return appointmentMapper.toResponse(appointment);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Update Appointment Status (generic PUT fallback — keeps backward compat)
    // ─────────────────────────────────────────────────────────────────────────

    public AppointmentResponse updateAppointmentStatus(String id, String status) {
        log.info("Updating appointment {} status to: {}", id, status);
        try {
            AppointmentStatus newStatus = AppointmentStatus.valueOf(status);
            switch (newStatus) {
                case CONFIRMED:
                    return confirmAppointment(id);
                case CANCELLED:
                    return cancelAppointment(id);
                case COMPLETED:
                    // Generic complete without prescription text
                    return completeAppointment(id, "");
                default:
                    Appointment appointment = appointmentRepository.findById(id)
                            .orElseThrow(() -> new RuntimeException("Appointment not found: " + id));
                    appointment.setStatus(newStatus);
                    appointment = appointmentRepository.save(appointment);
                    publishAppointmentEvent(appointment, status);
                    return appointmentMapper.toResponse(appointment);
            }
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid status: " + status);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Private helpers
    // ─────────────────────────────────────────────────────────────────────────

    private void publishAppointmentEvent(Appointment appointment, String type) {
        try {
            AppointmentEvent event = AppointmentEvent.builder()
                    .appointmentId(appointment.getId())
                    .patientId(appointment.getPatientId())
                    .patientName(appointment.getPatientName())
                    .patientEmail(appointment.getPatientEmail())
                    .patientPhone(appointment.getPatientPhone())
                    .doctorId(appointment.getDoctorId())
                    .doctorName(appointment.getDoctorName())
                    .doctorEmail(appointment.getDoctorEmail())
                    .doctorSpecialization(appointment.getDoctorSpecialization())
                    .appointmentTime(appointment.getAppointmentTime())
                    .appointmentDate(formatDate(appointment.getAppointmentTime()))
                    .appointmentTimeStr(formatTime(appointment.getAppointmentTime()))
                    .status(appointment.getStatus())
                    .reason(appointment.getReason())
                    .type(type)
                    .build();

            // Route to the correct Kafka topic based on event type
            eventProducer.publishEvent(event);
        } catch (Exception e) {
            log.error("Failed to publish event for appointment {}: {}", appointment.getId(), e.getMessage());
            // Event failure must NEVER crash the appointment workflow
        }
    }

    private String formatDate(LocalDateTime dt) {
        if (dt == null) return "";
        try {
            return dt.format(DATE_FMT);
        } catch (Exception e) {
            return dt.toLocalDate().toString();
        }
    }

    private String formatTime(LocalDateTime dt) {
        if (dt == null) return "";
        try {
            return dt.format(TIME_FMT);
        } catch (Exception e) {
            return dt.toLocalTime().toString();
        }
    }

    private String safeStr(Object val) {
        return val != null ? val.toString() : "";
    }
}
