package com.healthcare.patient.controller;

import com.healthcare.patient.dto.PatientDTO;
import com.healthcare.patient.model.MedicalHistory;
import com.healthcare.patient.model.MedicalReport;
import com.healthcare.patient.service.PatientService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/patients")
@RequiredArgsConstructor
public class PatientController {

    private final PatientService patientService;

    @GetMapping("/{id}")
    public ResponseEntity<PatientDTO> getPatient(@PathVariable String id) {
        return ResponseEntity.ok(patientService.getPatientById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PatientDTO> updatePatient(@PathVariable String id, @RequestBody PatientDTO patientDTO) {
        return ResponseEntity.ok(patientService.updatePatient(id, patientDTO));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deletePatient(@PathVariable String id) {
        patientService.deletePatient(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<PatientDTO>> getAllPatients() {
        return ResponseEntity.ok(patientService.getAllPatients());
    }

    // Medical Reports
    @PostMapping("/{id}/reports")
    public ResponseEntity<MedicalReport> uploadReport(
            @PathVariable String id,
            @RequestParam String fileName,
            @RequestParam String fileUrl) {
        return ResponseEntity.ok(patientService.uploadReport(id, fileName, fileUrl));
    }

    @GetMapping("/{id}/reports")
    public ResponseEntity<Page<MedicalReport>> getReports(@PathVariable String id, Pageable pageable) {
        return ResponseEntity.ok(patientService.getReports(id, pageable));
    }

    @GetMapping("/{id}/reports/{reportId}")
    public ResponseEntity<MedicalReport> getReport(@PathVariable String id, @PathVariable String reportId) {
        return ResponseEntity.ok(patientService.getReport(reportId));
    }

    // Medical History
    @PostMapping("/{id}/history")
    public ResponseEntity<MedicalHistory> addHistory(@PathVariable String id, @RequestBody MedicalHistory history) {
        return ResponseEntity.ok(patientService.addHistory(id, history));
    }

    @GetMapping("/{id}/history")
    public ResponseEntity<Page<MedicalHistory>> getHistory(@PathVariable String id, Pageable pageable) {
        return ResponseEntity.ok(patientService.getHistory(id, pageable));
    }

    @GetMapping("/health")
    public String health() {
        return "Patient Service is up and running!";
    }
}
