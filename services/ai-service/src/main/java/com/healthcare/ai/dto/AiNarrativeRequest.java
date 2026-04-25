package com.healthcare.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiNarrativeRequest {
    private List<String> symptoms;
    private Integer durationDays;
    private String severity;
    private String additionalNotes;
    private AssessmentResult assessmentResult;
}
