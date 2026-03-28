package com.healthcare.patient.service;

import com.healthcare.patient.dto.PatientDTO;
import com.healthcare.patient.exception.ResourceNotFoundException;
import com.healthcare.patient.model.MedicalHistory;
import com.healthcare.patient.model.MedicalReport;
import com.healthcare.patient.model.Patient;
import com.healthcare.patient.repository.MedicalHistoryRepository;
import com.healthcare.patient.repository.MedicalReportRepository;
import com.healthcare.patient.repository.PatientRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PatientService {

    private final PatientRepository patientRepository;
    private final MedicalReportRepository reportRepository;
    private final MedicalHistoryRepository historyRepository;

    public PatientDTO getPatientById(String id) {
        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found"));
        return mapToDTO(patient);
    }

    public PatientDTO updatePatient(String id, PatientDTO patientDTO) {
        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found"));
        
        patient.setName(patientDTO.getName());
        patient.setPhone(patientDTO.getPhone());
        patient.setAge(patientDTO.getAge());
        patient.setGender(patientDTO.getGender());
        patient.setAddress(patientDTO.getAddress());
        
        patientRepository.save(patient);
        return mapToDTO(patient);
    }

    public List<PatientDTO> getAllPatients() {
        return patientRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public void deletePatient(String id) {
        patientRepository.deleteById(id);
    }

    // Reports
    public MedicalReport uploadReport(String patientId, String fileName, String fileUrl) {
        MedicalReport report = MedicalReport.builder()
                .patientId(patientId)
                .fileName(fileName)
                .fileUrl(fileUrl)
                .uploadedDate(LocalDateTime.now())
                .build();
        return reportRepository.save(report);
    }

    public Page<MedicalReport> getReports(String patientId, Pageable pageable) {
        return reportRepository.findByPatientId(patientId, pageable);
    }

    public MedicalReport getReport(String reportId) {
        return reportRepository.findById(reportId)
                .orElseThrow(() -> new ResourceNotFoundException("Report not found"));
    }

    // History
    public MedicalHistory addHistory(String patientId, MedicalHistory history) {
        history.setPatientId(patientId);
        history.setDate(LocalDateTime.now());
        return historyRepository.save(history);
    }

    public Page<MedicalHistory> getHistory(String patientId, Pageable pageable) {
        return historyRepository.findByPatientId(patientId, pageable);
    }

    private PatientDTO mapToDTO(Patient patient) {
        return PatientDTO.builder()
                .id(patient.getId())
                .name(patient.getName())
                .email(patient.getEmail())
                .phone(patient.getPhone())
                .age(patient.getAge())
                .gender(patient.getGender())
                .address(patient.getAddress())
                .build();
    }
}
