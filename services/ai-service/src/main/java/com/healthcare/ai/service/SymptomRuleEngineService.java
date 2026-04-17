package com.healthcare.ai.service;

import com.healthcare.ai.dto.AssessmentResult;
import com.healthcare.ai.dto.SymptomCheckRequest;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class SymptomRuleEngineService {

    public AssessmentResult assess(SymptomCheckRequest request) {
        List<String> normalizedSymptoms = request.getSymptoms().stream()
                .map(this::normalize)
                .collect(Collectors.toList());

        String notes = normalize(request.getAdditionalNotes());
        String severity = request.getSeverity() == null ? "moderate" : request.getSeverity().trim().toLowerCase(Locale.ROOT);

        Set<String> symptomSet = new HashSet<>(normalizedSymptoms);
        List<String> redFlags = new ArrayList<>();

        captureRedFlag(symptomSet, notes, redFlags, "chest pain");
        captureRedFlag(symptomSet, notes, redFlags, "shortness of breath");
        captureRedFlag(symptomSet, notes, redFlags, "fainting");
        captureRedFlag(symptomSet, notes, redFlags, "seizure");
        captureRedFlag(symptomSet, notes, redFlags, "confusion");
        captureRedFlag(symptomSet, notes, redFlags, "heavy bleeding");
        captureRedFlag(symptomSet, notes, redFlags, "stroke");
        captureRedFlag(symptomSet, notes, redFlags, "suicidal thoughts");

        AssessmentResult result = AssessmentResult.builder()
                .urgency("LOW")
                .preliminaryHealthSuggestion("Your symptoms do not strongly match a high-risk rule pattern, but they should still be discussed with a qualified doctor if they continue or worsen.")
                .recommendedDoctorSpecialty("General Physician")
                .possibleConditions(new ArrayList<>())
                .suggestedNextSteps(new ArrayList<>())
                .redFlags(redFlags)
                .build();

        if (!redFlags.isEmpty()) {
            result.setUrgency("EMERGENCY");
            result.setRecommendedDoctorSpecialty("Emergency Medicine");
            result.setPreliminaryHealthSuggestion("One or more red-flag symptoms were detected. These symptoms may require urgent in-person medical attention.");
            result.getPossibleConditions().add("urgent medical condition");
            result.getSuggestedNextSteps().add("Seek immediate emergency medical care.");
            result.getSuggestedNextSteps().add("Do not rely only on the symptom checker for red-flag symptoms.");
            result.getSuggestedNextSteps().add("Contact emergency services or go to the nearest hospital.");
            return finalizeAssessment(result, severity, request.getDurationDays());
        }

        if (hasAll(symptomSet, "fever", "cough") || containsAny(symptomSet, "sore throat", "fatigue", "body pain")) {
            result.setUrgency("MEDIUM");
            result.setRecommendedDoctorSpecialty("General Physician");
            result.setPreliminaryHealthSuggestion("Your symptoms are commonly seen with viral or upper respiratory infections.");
            addDistinct(result.getPossibleConditions(), "viral infection", "flu-like illness", "upper respiratory tract infection");
            addDistinct(result.getSuggestedNextSteps(),
                    "Rest and maintain hydration.",
                    "Monitor your temperature and breathing.",
                    "Book a doctor consultation if symptoms worsen or do not improve.");
        }

        if (hasAll(symptomSet, "rash", "itching") || containsAny(symptomSet, "skin irritation", "hives")) {
            result.setUrgency(upgradeUrgency(result.getUrgency(), "LOW"));
            result.setRecommendedDoctorSpecialty("Dermatologist");
            result.setPreliminaryHealthSuggestion("Your symptoms may be related to an allergic or skin condition.");
            addDistinct(result.getPossibleConditions(), "allergic skin reaction", "eczema", "contact dermatitis");
            addDistinct(result.getSuggestedNextSteps(),
                    "Avoid possible skin irritants or recently introduced products.",
                    "Arrange a dermatologist consultation if the rash spreads or persists.");
        }

        if (hasAll(symptomSet, "abdominal pain", "vomiting") || hasAll(symptomSet, "stomach pain", "vomiting")) {
            result.setUrgency(upgradeUrgency(result.getUrgency(), "MEDIUM"));
            result.setRecommendedDoctorSpecialty("Gastroenterologist");
            result.setPreliminaryHealthSuggestion("Your symptoms may indicate a digestive or gastrointestinal issue.");
            addDistinct(result.getPossibleConditions(), "gastritis", "food poisoning", "gastroenteritis");
            addDistinct(result.getSuggestedNextSteps(),
                    "Take oral fluids in small amounts to avoid dehydration.",
                    "Seek medical advice if vomiting is persistent or severe.");
        }

        if (hasAll(symptomSet, "headache", "blurred vision") || hasAll(symptomSet, "headache", "dizziness")) {
            result.setUrgency(upgradeUrgency(result.getUrgency(), "HIGH"));
            result.setRecommendedDoctorSpecialty("Neurologist");
            result.setPreliminaryHealthSuggestion("Your symptoms may need prompt medical review because some neurological or vision-related conditions can present this way.");
            addDistinct(result.getPossibleConditions(), "migraine", "neurological disorder", "vision-related complication");
            addDistinct(result.getSuggestedNextSteps(),
                    "Arrange medical attention within 24 hours.",
                    "Avoid driving until a doctor evaluates the symptoms.");
        }

        if (hasAll(symptomSet, "joint pain", "swelling")) {
            result.setUrgency(upgradeUrgency(result.getUrgency(), "MEDIUM"));
            result.setRecommendedDoctorSpecialty("Rheumatologist");
            result.setPreliminaryHealthSuggestion("Your symptoms may be associated with an inflammatory or joint-related condition.");
            addDistinct(result.getPossibleConditions(), "arthritis", "joint inflammation");
            addDistinct(result.getSuggestedNextSteps(),
                    "Limit activities that worsen the pain.",
                    "Arrange a specialist consultation if symptoms persist.");
        }

        if (containsAny(symptomSet, "ear pain", "hearing loss", "sore throat", "sinus pain")) {
            result.setUrgency(upgradeUrgency(result.getUrgency(), "LOW"));
            result.setRecommendedDoctorSpecialty("ENT Specialist");
            result.setPreliminaryHealthSuggestion("The symptom pattern suggests an ear, nose, or throat related issue.");
            addDistinct(result.getPossibleConditions(), "sinus infection", "throat infection", "ear infection");
            addDistinct(result.getSuggestedNextSteps(),
                    "Schedule an ENT consultation if symptoms continue.");
        }

        if (containsAny(symptomSet, "palpitations", "high blood pressure") || notes.contains("heart")) {
            result.setUrgency(upgradeUrgency(result.getUrgency(), "HIGH"));
            result.setRecommendedDoctorSpecialty("Cardiologist");
            result.setPreliminaryHealthSuggestion("Some of your symptoms may need cardiovascular review.");
            addDistinct(result.getPossibleConditions(), "cardiovascular concern");
            addDistinct(result.getSuggestedNextSteps(),
                    "Arrange medical evaluation as soon as possible.");
        }

        if (request.getDurationDays() != null && request.getDurationDays() >= 7 && "LOW".equals(result.getUrgency())) {
            result.setUrgency("MEDIUM");
            addDistinct(result.getSuggestedNextSteps(), "Because symptoms have lasted several days, book a consultation with a doctor.");
        }

        return finalizeAssessment(result, severity, request.getDurationDays());
    }

    private AssessmentResult finalizeAssessment(AssessmentResult result, String severity, Integer durationDays) {
        if ("severe".equals(severity) && !"EMERGENCY".equals(result.getUrgency())) {
            result.setUrgency(upgradeUrgency(result.getUrgency(), "HIGH"));
            addDistinct(result.getSuggestedNextSteps(), "Because you marked the symptoms as severe, seek medical care as soon as possible.");
        }

        if (durationDays != null && durationDays >= 14) {
            addDistinct(result.getSuggestedNextSteps(), "Because symptoms have continued for two weeks or more, schedule an in-person review.");
        }

        addDistinct(result.getSuggestedNextSteps(), "Use the recommended specialty to book a doctor appointment through the platform.");
        return result;
    }

    private void captureRedFlag(Set<String> symptomSet, String notes, List<String> redFlags, String redFlag) {
        if (symptomSet.contains(redFlag) || notes.contains(redFlag)) {
            redFlags.add(titleCase(redFlag));
        }
    }

    private boolean hasAll(Set<String> symptomSet, String... symptoms) {
        for (String symptom : symptoms) {
            if (!symptomSet.contains(symptom)) {
                return false;
            }
        }
        return true;
    }

    private boolean containsAny(Set<String> symptomSet, String... symptoms) {
        for (String symptom : symptoms) {
            if (symptomSet.contains(symptom)) {
                return true;
            }
        }
        return false;
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }

    private void addDistinct(List<String> target, String... values) {
        for (String value : values) {
            if (!target.contains(value)) {
                target.add(value);
            }
        }
    }

    private String upgradeUrgency(String current, String next) {
        List<String> order = List.of("LOW", "MEDIUM", "HIGH", "EMERGENCY");
        return order.indexOf(next) > order.indexOf(current) ? next : current;
    }

    private String titleCase(String value) {
        String[] words = value.split(" ");
        StringBuilder builder = new StringBuilder();
        for (int i = 0; i < words.length; i++) {
            String word = words[i];
            if (word.isBlank()) {
                continue;
            }
            builder.append(Character.toUpperCase(word.charAt(0)))
                    .append(word.substring(1));
            if (i < words.length - 1) {
                builder.append(' ');
            }
        }
        return builder.toString();
    }
}
