package com.healthcare.ai.controller;

import com.healthcare.ai.dto.SymptomCheckRequest;
import com.healthcare.ai.dto.SymptomCheckResponse;
import com.healthcare.ai.dto.SymptomHistoryItemResponse;
import com.healthcare.ai.service.SymptomCheckerService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.validation.Valid;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class SymptomCheckerController {

    private final SymptomCheckerService symptomCheckerService;

    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of("status", "AI Symptom Checker Service is up and running");
    }

    @Operation(summary = "Submit symptoms and receive a preliminary health suggestion")
    @PostMapping("/check")
    public ResponseEntity<SymptomCheckResponse> checkSymptoms(
            @Valid @RequestBody SymptomCheckRequest request,
            Authentication authentication
    ) {
        String patientEmail = authentication.getName();
        return ResponseEntity.ok(symptomCheckerService.analyzeSymptoms(patientEmail, request));
    }

    @Operation(summary = "Get current patient's symptom checker history")
    @GetMapping("/history/me")
    public ResponseEntity<List<SymptomHistoryItemResponse>> getMyHistory(Authentication authentication) {
        String patientEmail = authentication.getName();
        return ResponseEntity.ok(symptomCheckerService.getHistory(patientEmail));
    }

    @Operation(summary = "Get one symptom checker history item for the current patient")
    @GetMapping("/history/{id}")
    public ResponseEntity<SymptomCheckResponse> getHistoryItem(
            @PathVariable String id,
            Authentication authentication
    ) {
        String patientEmail = authentication.getName();
        return ResponseEntity.ok(symptomCheckerService.getHistoryItem(patientEmail, id));
    }

    @GetMapping("/specialties")
    public ResponseEntity<List<String>> getSupportedSpecialties() {
        return ResponseEntity.ok(List.of(
                "General Physician",
                "Dermatologist",
                "Cardiologist",
                "Neurologist",
                "Gastroenterologist",
                "ENT Specialist",
                "Rheumatologist",
                "Emergency Medicine"
        ));
    }
}
