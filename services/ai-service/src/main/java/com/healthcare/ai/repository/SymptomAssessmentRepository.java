package com.healthcare.ai.repository;

import com.healthcare.ai.model.SymptomAssessment;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface SymptomAssessmentRepository extends MongoRepository<SymptomAssessment, String> {
    List<SymptomAssessment> findByPatientEmailOrderByCreatedAtDesc(String patientEmail);
    Optional<SymptomAssessment> findByIdAndPatientEmail(String id, String patientEmail);
}
