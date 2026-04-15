package com.healthcare.ai.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "symptom_assessments")
public class SymptomAssessment {
    @Id
    private String id;

    @Indexed
    private String patientEmail;

    private List<String> submittedSymptoms;
    private Integer durationDays;
    private String severity;
    private String additionalNotes;

    private String urgency;
    private String preliminaryHealthSuggestion;
    private List<String> suggestedNextSteps;
    private String recommendedDoctorSpecialty;
    private List<String> possibleConditions;
    private List<String> redFlags;
    private String disclaimer;

    @Builder.Default
    private Instant createdAt = Instant.now();
}
