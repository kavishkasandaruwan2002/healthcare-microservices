package com.healthcare.ai.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.healthcare.ai.dto.AssessmentResult;
import com.healthcare.ai.dto.SymptomCheckRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiNarrativeService {

    private final RestTemplate restTemplate;

    private final ObjectMapper objectMapper = new ObjectMapper()
            .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

    @Value("${app.ai.provider:rules}")
    private String provider;

    @Value("${app.ai.gemini.api-key:}")
    private String geminiApiKey;

    @Value("${app.ai.gemini.model:gemini-2.5-flash}")
    private String geminiModel;

    @Value("${app.ai.gemini.base-url:https://generativelanguage.googleapis.com}")
    private String geminiBaseUrl;

    public AssessmentResult generateAssessment(SymptomCheckRequest request, AssessmentResult fallback) {
        if (!"gemini".equalsIgnoreCase(provider) || !StringUtils.hasText(geminiApiKey)) {
            return fallback;
        }

        try {
            String url = geminiBaseUrl + "/v1beta/models/" + geminiModel + ":generateContent";

            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("contents", List.of(
                    Map.of(
                            "role", "user",
                            "parts", List.of(Map.of("text", buildPrompt(request)))
                    )
            ));

            payload.put("generationConfig", Map.of(
                    "temperature", 0.2,
                    "responseMimeType", "application/json",
                    "responseJsonSchema", buildResponseSchema()
            ));

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("x-goog-api-key", geminiApiKey);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(payload, headers);
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, entity, String.class);

            JsonNode root = objectMapper.readTree(response.getBody());
            JsonNode textNode = root.path("candidates").path(0).path("content").path("parts").path(0).path("text");

            if (!textNode.isTextual() || !StringUtils.hasText(textNode.asText())) {
                log.warn("Gemini returned no usable text. Falling back to rule engine.");
                return fallback;
            }

            AssessmentResult geminiResult = parseGeminiJson(textNode.asText());
            return applySafetyFallback(geminiResult, fallback);

        } catch (Exception ex) {
            log.warn("Gemini assessment failed. Falling back to rule engine. Reason: {}", ex.getMessage());
            return fallback;
        }
    }

    private AssessmentResult parseGeminiJson(String json) throws JsonProcessingException {
        AssessmentResult result = objectMapper.readValue(json, AssessmentResult.class);

        if (result.getSuggestedNextSteps() == null) {
            result.setSuggestedNextSteps(new ArrayList<>());
        }
        if (result.getPossibleConditions() == null) {
            result.setPossibleConditions(new ArrayList<>());
        }
        if (result.getRedFlags() == null) {
            result.setRedFlags(new ArrayList<>());
        }

        if (result.getUrgency() != null) {
            result.setUrgency(result.getUrgency().trim().toUpperCase(Locale.ROOT));
        }

        return result;
    }

    private AssessmentResult applySafetyFallback(AssessmentResult ai, AssessmentResult fallback) {
        if (ai == null) {
            return fallback;
        }

        if (!StringUtils.hasText(ai.getUrgency())) {
            ai.setUrgency(fallback.getUrgency());
        }
        if (!StringUtils.hasText(ai.getPreliminaryHealthSuggestion())) {
            ai.setPreliminaryHealthSuggestion(fallback.getPreliminaryHealthSuggestion());
        }
        if (!StringUtils.hasText(ai.getRecommendedDoctorSpecialty())) {
            ai.setRecommendedDoctorSpecialty(fallback.getRecommendedDoctorSpecialty());
        }
        if (ai.getSuggestedNextSteps() == null || ai.getSuggestedNextSteps().isEmpty()) {
            ai.setSuggestedNextSteps(fallback.getSuggestedNextSteps());
        }
        if (ai.getPossibleConditions() == null || ai.getPossibleConditions().isEmpty()) {
            ai.setPossibleConditions(fallback.getPossibleConditions());
        }
        if (ai.getRedFlags() == null || ai.getRedFlags().isEmpty()) {
            ai.setRedFlags(fallback.getRedFlags());
        } else if (fallback.getRedFlags() != null && !fallback.getRedFlags().isEmpty()) {
            LinkedHashSet<String> merged = new LinkedHashSet<>(ai.getRedFlags());
            merged.addAll(fallback.getRedFlags());
            ai.setRedFlags(new ArrayList<>(merged));
        }

        if (urgencyRank(fallback.getUrgency()) > urgencyRank(ai.getUrgency())) {
            ai.setUrgency(fallback.getUrgency());
        }

        return ai;
    }

    private int urgencyRank(String urgency) {
        if (urgency == null) return 0;

        return switch (urgency.trim().toUpperCase(Locale.ROOT)) {
            case "LOW" -> 1;
            case "MEDIUM" -> 2;
            case "HIGH" -> 3;
            case "EMERGENCY" -> 4;
            default -> 0;
        };
    }

    private String buildPrompt(SymptomCheckRequest request) {
        return """
                You are an AI symptom checker for a healthcare appointment platform.
                Analyze the patient's symptoms and return ONLY valid JSON.

                Rules:
                - Do NOT diagnose with certainty.
                - Give only preliminary health suggestions.
                - Recommend exactly one doctor specialty.
                - Urgency must be one of: LOW, MEDIUM, HIGH, EMERGENCY.
                - suggestedNextSteps must contain 2 to 4 short strings.
                - possibleConditions must contain broad, non-certain categories.
                - redFlags can be empty if none are obvious.
                - Keep the wording safe, brief, and patient-friendly.
                - Do not include markdown or code fences.

                Patient input:
                Symptoms: %s
                Duration in days: %s
                Severity: %s
                Additional notes: %s

                Recommended specialty should be one of these when possible:
                General Physician, Cardiologist, Dermatologist, Gastroenterologist,
                Neurologist, Pulmonologist, ENT Specialist, Pediatrician,
                Obstetrician/Gynecologist, Emergency Medicine.
                """.formatted(
                request.getSymptoms(),
                request.getDurationDays(),
                request.getSeverity(),
                request.getAdditionalNotes() == null ? "" : request.getAdditionalNotes()
        );
    }

    private Map<String, Object> buildResponseSchema() {
        Map<String, Object> schema = new LinkedHashMap<>();
        schema.put("type", "object");

        Map<String, Object> properties = new LinkedHashMap<>();

        properties.put("urgency", Map.of(
                "type", "string",
                "enum", List.of("LOW", "MEDIUM", "HIGH", "EMERGENCY")
        ));

        properties.put("preliminaryHealthSuggestion", Map.of(
                "type", "string"
        ));

        properties.put("suggestedNextSteps", Map.of(
                "type", "array",
                "items", Map.of("type", "string")
        ));

        properties.put("recommendedDoctorSpecialty", Map.of(
                "type", "string"
        ));

        properties.put("possibleConditions", Map.of(
                "type", "array",
                "items", Map.of("type", "string")
        ));

        properties.put("redFlags", Map.of(
                "type", "array",
                "items", Map.of("type", "string")
        ));

        schema.put("properties", properties);
        schema.put("required", List.of(
                "urgency",
                "preliminaryHealthSuggestion",
                "suggestedNextSteps",
                "recommendedDoctorSpecialty",
                "possibleConditions",
                "redFlags"
        ));

        return schema;
    }
}