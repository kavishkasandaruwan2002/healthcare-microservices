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
public class SymptomHistoryItemResponse {
    private String id;
    private List<String> submittedSymptoms;
    private String urgency;
    private String recommendedDoctorSpecialty;
    private String preliminaryHealthSuggestion;
    private Instant createdAt;
}
