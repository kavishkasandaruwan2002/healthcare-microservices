package com.healthcare.appointment.controller;

import com.healthcare.appointment.dto.AppointmentRequest;
import com.healthcare.appointment.dto.AppointmentResponse;
import com.healthcare.appointment.service.AppointmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/appointments")
@RequiredArgsConstructor
@Tag(name = "Appointment Service", description = "Management of Healthcare Appointments")
public class AppointmentController {

    private final AppointmentService appointmentService;

    @PostMapping
    @Operation(summary = "Book a new appointment", description = "Create a PENDING appointment for a doctor and patient.")
    public ResponseEntity<AppointmentResponse> bookAppointment(@Valid @RequestBody AppointmentRequest request) {
        return ResponseEntity.ok(appointmentService.createAppointment(request));
    }

    @GetMapping("/patient/{patientId}")
    @Operation(summary = "Get patient appointments", description = "Retrieve list of all appointments for a patient.")
    public ResponseEntity<List<AppointmentResponse>> getPatientAppointments(@PathVariable String patientId) {
        return ResponseEntity.ok(appointmentService.getPatientAppointments(patientId));
    }

    @GetMapping("/doctor/{doctorId}")
    @Operation(summary = "Get doctor appointments", description = "Retrieve list of all appointments for a doctor.")
    public ResponseEntity<List<AppointmentResponse>> getDoctorAppointments(@PathVariable String doctorId) {
        return ResponseEntity.ok(appointmentService.getDoctorAppointments(doctorId));
    }

    @PatchMapping("/{id}/confirm")
    @Operation(summary = "Confirm an appointment", description = "Move an appointment status to CONFIRMED.")
    public ResponseEntity<AppointmentResponse> confirmAppointment(@PathVariable String id) {
        return ResponseEntity.ok(appointmentService.confirmAppointment(id));
    }

    @PatchMapping("/{id}/cancel")
    @Operation(summary = "Cancel an appointment", description = "Move an appointment status to CANCELLED.")
    public ResponseEntity<AppointmentResponse> cancelAppointment(@PathVariable String id) {
        return ResponseEntity.ok(appointmentService.cancelAppointment(id));
    }

    @PatchMapping("/{id}/complete")
    @Operation(summary = "Complete an appointment", description = "Move an appointment status to COMPLETED and add prescription.")
    public ResponseEntity<AppointmentResponse> completeAppointment(@PathVariable String id, @RequestParam String prescription) {
        return ResponseEntity.ok(appointmentService.completeAppointment(id, prescription));
    }

}
