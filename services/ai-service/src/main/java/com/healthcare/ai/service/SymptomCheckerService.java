package com.healthcare.ai.service;

import com.healthcare.ai.dto.AssessmentResult;
import com.healthcare.ai.dto.SymptomCheckRequest;
import com.healthcare.ai.dto.SymptomCheckResponse;
import com.healthcare.ai.dto.SymptomHistoryItemResponse;
import com.healthcare.ai.model.SymptomAssessment;
import com.healthcare.ai.repository.SymptomAssessmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SymptomCheckerService {

    private static final String DISCLAIMER = "This is an AI-based preliminary health suggestion and not a medical diagnosis. For emergencies or severe symptoms, seek immediate medical attention.";

    private final SymptomRuleEngineService symptomRuleEngineService;
    private final SymptomAssessmentRepository symptomAssessmentRepository;
    private final AiNarrativeService aiNarrativeService;

    public SymptomCheckResponse analyzeSymptoms(String patientEmail, SymptomCheckRequest request) {
        validateSeverity(request.getSeverity());

        AssessmentResult ruleBasedResult = symptomRuleEngineService.assess(request);
        AssessmentResult finalResult = aiNarrativeService.generateAssessment(request, ruleBasedResult);

        SymptomAssessment saved = symptomAssessmentRepository.save(
                SymptomAssessment.builder()
                        .patientEmail(patientEmail)
                        .submittedSymptoms(request.getSymptoms())
                        .durationDays(request.getDurationDays())
                        .severity(request.getSeverity())
                        .additionalNotes(request.getAdditionalNotes())
                        .urgency(finalResult.getUrgency())
                        .preliminaryHealthSuggestion(finalResult.getPreliminaryHealthSuggestion())
                        .suggestedNextSteps(finalResult.getSuggestedNextSteps())
                        .recommendedDoctorSpecialty(finalResult.getRecommendedDoctorSpecialty())
                        .possibleConditions(finalResult.getPossibleConditions())
                        .redFlags(finalResult.getRedFlags())
                        .disclaimer(DISCLAIMER)
                        .createdAt(Instant.now())
                        .build()
        );

        return mapToResponse(saved);
    }

    public List<SymptomHistoryItemResponse> getHistory(String patientEmail) {
        return symptomAssessmentRepository.findByPatientEmailOrderByCreatedAtDesc(patientEmail)
                .stream()
                .map(this::mapToHistoryItem)
                .collect(Collectors.toList());
    }

    public SymptomCheckResponse getHistoryItem(String patientEmail, String id) {
        SymptomAssessment assessment = symptomAssessmentRepository.findByIdAndPatientEmail(id, patientEmail)
                .orElseThrow(() -> new IllegalArgumentException("History item not found"));
        return mapToResponse(assessment);
    }

    private void validateSeverity(String severity) {
        if (severity == null) {
            throw new IllegalArgumentException("Severity is required");
        }
        String normalized = severity.trim().toLowerCase();
        if (!List.of("mild", "moderate", "severe").contains(normalized)) {
            throw new IllegalArgumentException("Severity must be mild, moderate, or severe");
        }
    }

    private SymptomCheckResponse mapToResponse(SymptomAssessment assessment) {
        return SymptomCheckResponse.builder()
                .id(assessment.getId())
                .submittedSymptoms(assessment.getSubmittedSymptoms())
                .durationDays(assessment.getDurationDays())
                .severity(assessment.getSeverity())
                .urgency(assessment.getUrgency())
                .preliminaryHealthSuggestion(assessment.getPreliminaryHealthSuggestion())
                .suggestedNextSteps(assessment.getSuggestedNextSteps())
                .recommendedDoctorSpecialty(assessment.getRecommendedDoctorSpecialty())
                .possibleConditions(assessment.getPossibleConditions())
                .redFlags(assessment.getRedFlags())
                .disclaimer(assessment.getDisclaimer())
                .createdAt(assessment.getCreatedAt())
                .build();
    }

    private SymptomHistoryItemResponse mapToHistoryItem(SymptomAssessment assessment) {
        return SymptomHistoryItemResponse.builder()
                .id(assessment.getId())
                .submittedSymptoms(assessment.getSubmittedSymptoms())
                .urgency(assessment.getUrgency())
                .recommendedDoctorSpecialty(assessment.getRecommendedDoctorSpecialty())
                .preliminaryHealthSuggestion(assessment.getPreliminaryHealthSuggestion())
                .createdAt(assessment.getCreatedAt())
                .build();
    }
}