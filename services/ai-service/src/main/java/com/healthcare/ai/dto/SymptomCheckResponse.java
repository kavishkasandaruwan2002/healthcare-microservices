package com.healthcare.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SymptomCheckResponse {
    private String id;
    private List<String> submittedSymptoms;
    private Integer durationDays;
    private String severity;
    private String urgency;
    private String preliminaryHealthSuggestion;
    private List<String> suggestedNextSteps;
    private String recommendedDoctorSpecialty;
    private List<String> possibleConditions;
    private List<String> redFlags;
    private String disclaimer;
    private Instant createdAt;
}
