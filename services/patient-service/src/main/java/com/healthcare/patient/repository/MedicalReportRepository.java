package com.healthcare.patient.repository;

import com.healthcare.patient.model.MedicalReport;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface MedicalReportRepository extends MongoRepository<MedicalReport, String> {
    Page<MedicalReport> findByPatientId(String patientId, Pageable pageable);
}
