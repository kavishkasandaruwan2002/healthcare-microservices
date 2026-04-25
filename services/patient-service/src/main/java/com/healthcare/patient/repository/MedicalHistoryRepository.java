package com.healthcare.patient.repository;

import com.healthcare.patient.model.MedicalHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface MedicalHistoryRepository extends MongoRepository<MedicalHistory, String> {
    Page<MedicalHistory> findByPatientId(String patientId, Pageable pageable);
}
