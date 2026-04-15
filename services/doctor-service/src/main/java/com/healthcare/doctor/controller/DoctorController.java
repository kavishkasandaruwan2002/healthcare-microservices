package com.healthcare.doctor.controller;

import com.healthcare.doctor.dto.DoctorAuthResponse;
import com.healthcare.doctor.dto.DoctorDTO;
import com.healthcare.doctor.dto.DoctorLoginRequest;
import com.healthcare.doctor.dto.DoctorRegisterRequest;
import com.healthcare.doctor.model.Doctor;
import com.healthcare.doctor.service.DoctorService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/doctors")
@RequiredArgsConstructor
@Slf4j
public class DoctorController {

    private final DoctorService doctorService;

    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("Doctor Service is up and running!");
    }

    @PostMapping("/register")
    public ResponseEntity<DoctorAuthResponse> registerDoctor(@Valid @RequestBody DoctorRegisterRequest request) {
        log.info("Registering doctor: {}", request.getEmail());
        return ResponseEntity.ok(doctorService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<DoctorAuthResponse> loginDoctor(@Valid @RequestBody DoctorLoginRequest request) {
        log.info("Doctor login attempt: {}", request.getEmail());
        return ResponseEntity.ok(doctorService.login(request.getEmail(), request.getPassword()));
    }

    // IMPORTANT: More specific routes must come BEFORE less specific routes

    @GetMapping("/specialization/{specialization}")
    public ResponseEntity<List<DoctorDTO>> getDoctorsBySpecialization(@PathVariable String specialization) {
        log.info("Fetching doctors by specialization: {}", specialization);
        return ResponseEntity.ok(doctorService.getDoctorsBySpecialization(specialization));
    }

    @GetMapping("/admin/pending")
    public ResponseEntity<List<DoctorDTO>> getPendingDoctors() {
        log.info("Fetching pending doctors");
        return ResponseEntity.ok(doctorService.getPendingDoctors());
    }

    @GetMapping("/verified")
    public ResponseEntity<List<DoctorDTO>> getAllVerifiedDoctors() {
        log.info("Fetching all verified doctors");
        return ResponseEntity.ok(doctorService.getAllVerifiedDoctors());
    }

    // Less specific route AFTER specific routes
    @GetMapping("/{id}")
    public ResponseEntity<DoctorDTO> getDoctorById(@PathVariable String id) {
        log.info("Fetching doctor by id: {}", id);
        try {
            DoctorDTO doctor = doctorService.getDoctorByIdDTO(id);
            log.info("Successfully fetched doctor: {}", doctor.getEmail());
            return ResponseEntity.ok(doctor);
        } catch (Exception e) {
            log.error("Error fetching doctor with id: {}", id, e);
            throw e;
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<DoctorDTO> updateDoctor(@PathVariable String id, @RequestBody Doctor doctor) {
        log.info("Updating doctor: {}", id);
        return ResponseEntity.ok(doctorService.updateDoctor(id, doctor));
    }

    @PostMapping("/{id}/slots")
    public ResponseEntity<DoctorDTO> addAvailabilitySlot(@PathVariable String id,
            @RequestBody com.healthcare.doctor.model.AvailabilitySlot slot) {
        log.info("Adding availability slot for doctor: {}", id);
        return ResponseEntity.ok(doctorService.addAvailabilitySlot(id, slot));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<String> updateDoctorStatus(
            @PathVariable String id,
            @RequestParam String status,
            @RequestParam(required = false) String rejectionReason) {
        log.info("Updating doctor status: {} to {}", id, status);
        doctorService.updateDoctorStatus(id, status, rejectionReason);
        return ResponseEntity.ok("Doctor status updated successfully");
    }
}
