package com.healthcare.doctor.controller;

import com.healthcare.doctor.model.Prescription;
import com.healthcare.doctor.service.PrescriptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/doctors/{doctorId}/prescriptions")
@RequiredArgsConstructor
public class PrescriptionController {

    private final PrescriptionService prescriptionService;

    @PostMapping
    public ResponseEntity<Prescription> issuePrescription(
            @PathVariable String doctorId,
            @RequestBody Prescription prescription) {
        return ResponseEntity.ok(prescriptionService.issuePrescription(doctorId, prescription));
    }

    @GetMapping
    public ResponseEntity<List<Prescription>> getPrescriptions(@PathVariable String doctorId) {
        return ResponseEntity.ok(prescriptionService.getPrescriptionsByDoctor(doctorId));
    }

    @DeleteMapping("/{prescriptionId}")
    public ResponseEntity<Void> deletePrescription(@PathVariable String doctorId, @PathVariable String prescriptionId) {
        prescriptionService.deletePrescription(prescriptionId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{prescriptionId}")
    public ResponseEntity<Prescription> updatePrescription(
            @PathVariable String doctorId,
            @PathVariable String prescriptionId,
            @RequestBody Prescription prescription) {
        return ResponseEntity.ok(prescriptionService.updatePrescription(prescriptionId, prescription));
    }
}
