package com.healthcare.ai.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class AssessmentResult {
    private String urgency;
    private String preliminaryHealthSuggestion;
    private List<String> suggestedNextSteps = new ArrayList<>();
    private String recommendedDoctorSpecialty;
    private List<String> possibleConditions = new ArrayList<>();
    private List<String> redFlags = new ArrayList<>();
}