package com.healthcare.appointment.controller;

import com.healthcare.appointment.dto.AppointmentBookingRequest;
import com.healthcare.appointment.dto.AppointmentRequest;
import com.healthcare.appointment.dto.AppointmentResponse;
import com.healthcare.appointment.service.AppointmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/appointments")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Appointment Service", description = "Management of Healthcare Appointments")
public class AppointmentController {

    private final AppointmentService appointmentService;

    /**
     * Book appointment with frontend-compatible format (date/time strings)
     */
    @PostMapping
    @Operation(summary = "Book appointment", description = "Create appointment with date and time (separate fields)")
    public ResponseEntity<AppointmentResponse> bookAppointment(@Valid @RequestBody AppointmentBookingRequest request) {
        log.info("Booking appointment request received for patient: {}, doctor: {}", 
                 request.getPatientId(), request.getDoctorId());
        try {
            AppointmentResponse response = appointmentService.createAppointmentFromBooking(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error booking appointment: {}", e.getMessage());
            throw e;
        }
    }

    /**
     * Alternative booking endpoint with LocalDateTime
     */
    @PostMapping("/book")
    @Operation(summary = "Book appointment (alternative)", description = "Create appointment with LocalDateTime")
    public ResponseEntity<AppointmentResponse> bookAppointmentAlternative(@Valid @RequestBody AppointmentRequest request) {
        log.info("Alternative booking request received");
        AppointmentResponse response = appointmentService.createAppointment(request);
        return ResponseEntity.ok(response);
    }

    /**
     * Get patient appointments
     */
    @GetMapping("/patient/{patientId}")
    @Operation(summary = "Get patient appointments", description = "Retrieve all appointments for a patient")
    public ResponseEntity<List<AppointmentResponse>> getPatientAppointments(@PathVariable String patientId) {
        log.info("Fetching appointments for patient: {}", patientId);
        return ResponseEntity.ok(appointmentService.getPatientAppointments(patientId));
    }

    /**
     * Get appointment by ID
     */
    @GetMapping("/{id}")
    @Operation(summary = "Get appointment by ID", description = "Retrieve a specific appointment by its ID")
    public ResponseEntity<AppointmentResponse> getAppointmentById(@PathVariable String id) {
        log.info("Fetching appointment by ID: {}", id);
        return ResponseEntity.ok(appointmentService.getAppointmentById(id));
    }

    /**
     * Get doctor appointments
     */
    @GetMapping("/doctor/{doctorId}")
    @Operation(summary = "Get doctor appointments", description = "Retrieve all appointments for a doctor")
    public ResponseEntity<List<AppointmentResponse>> getDoctorAppointments(@PathVariable String doctorId) {
        log.info("Fetching appointments for doctor: {}", doctorId);
        return ResponseEntity.ok(appointmentService.getDoctorAppointments(doctorId));
    }

    /**
     * Confirm appointment
     */
    @PatchMapping("/{id}/confirm")
    @Operation(summary = "Confirm appointment", description = "Change appointment status to CONFIRMED")
    public ResponseEntity<AppointmentResponse> confirmAppointment(@PathVariable String id) {
        log.info("Confirming appointment: {}", id);
        return ResponseEntity.ok(appointmentService.confirmAppointment(id));
    }

    /**
     * Cancel appointment
     */
    @PatchMapping("/{id}/cancel")
    @Operation(summary = "Cancel appointment", description = "Change appointment status to CANCELLED")
    public ResponseEntity<AppointmentResponse> cancelAppointment(@PathVariable String id) {
        log.info("Cancelling appointment: {}", id);
        return ResponseEntity.ok(appointmentService.cancelAppointment(id));
    }

    /**
     * Complete appointment
     */
    @PatchMapping("/{id}/complete")
    @Operation(summary = "Complete appointment", description = "Mark appointment as completed")
    public ResponseEntity<AppointmentResponse> completeAppointment(@PathVariable String id, @RequestParam String prescription) {
        log.info("Completing appointment: {}", id);
        return ResponseEntity.ok(appointmentService.completeAppointment(id, prescription));
    }

    /**
     * Update appointment status (generic)
     */
    @PutMapping("/{id}")
    @Operation(summary = "Update appointment status", description = "Update appointment status field")
    public ResponseEntity<AppointmentResponse> updateAppointmentStatus(
            @PathVariable String id,
            @RequestBody statusUpdateRequest request) {
        log.info("Updating appointment {} to status: {}", id, request.getStatus());
        return ResponseEntity.ok(appointmentService.updateAppointmentStatus(id, request.getStatus()));
    }

    @lombok.Data
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class statusUpdateRequest {
        private String status;
    }
}
