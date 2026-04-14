package com.healthcare.doctor.service;

import com.healthcare.doctor.client.NotificationClient;
import com.healthcare.doctor.model.Prescription;
import com.healthcare.doctor.repository.PrescriptionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class PrescriptionService {

    private final PrescriptionRepository prescriptionRepository;
    private final NotificationClient notificationClient;

    public Prescription issuePrescription(String doctorId, Prescription prescription) {
        prescription.setDoctorId(doctorId);
        prescription.setDateIssued(System.currentTimeMillis());
        Prescription saved = prescriptionRepository.save(prescription);
        log.info("Prescription issued successfully: {}", saved.getId());

        // Notify patient
        try {
            String patientEmail = prescription.getPatientId() + "@patient.com"; // Simulated email
            notificationClient.sendPrescriptionIssuedEmail(
                    patientEmail,
                    prescription.getPatientId(),
                    doctorId,
                    prescription.getPatientName(),
                    prescription.getMedications()
            );
        } catch (Exception ex) {
            log.warn("Failed to send prescription notification: {}", ex.getMessage());
        }

        return saved;
    }

    public List<Prescription> getPrescriptionsByDoctor(String doctorId) {
        return prescriptionRepository.findByDoctorId(doctorId);
    }
}
