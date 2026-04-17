package com.healthcare.appointment.client;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.RestClientException;
import java.util.HashMap;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class ExternalServiceClient {

    private final RestTemplate restTemplate;

    @Value("${doctor.service.url:http://localhost:8082}")
    private String doctorServiceUrl;

    @Value("${patient.service.url:http://localhost:8083}")
    private String patientServiceUrl;

    /**
     * Fetch doctor details from doctor service
     */
    public Map<String, Object> getDoctorDetails(String doctorId) {
        try {
            String url = doctorServiceUrl + "/api/doctors/" + doctorId;
            log.info("Fetching doctor details from: {}", url);
            
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);
            if (response == null) {
                log.warn("Doctor not found: {}", doctorId);
                return new HashMap<>();
            }
            return response;
        } catch (RestClientException e) {
            log.error("Failed to fetch doctor details for ID: {}. Error: {}", doctorId, e.getMessage());
            return new HashMap<>();
        }
    }

    /**
     * Fetch patient details from patient service
     */
    public Map<String, Object> getPatientDetails(String patientId) {
        try {
            String url = patientServiceUrl + "/api/patients/" + patientId;
            log.info("Fetching patient details from: {}", url);
            
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);
            if (response == null) {
                log.warn("Patient not found: {}", patientId);
                return new HashMap<>();
            }
            return response;
        } catch (RestClientException e) {
            log.error("Failed to fetch patient details for ID: {}. Error: {}", patientId, e.getMessage());
            return new HashMap<>();
        }
    }

    /**
     * Verify doctor exists
     */
    public boolean isDoctorExists(String doctorId) {
        try {
            Map<String, Object> doctor = getDoctorDetails(doctorId);
            return doctor != null && !doctor.isEmpty();
        } catch (Exception e) {
            log.error("Error verifying doctor: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Verify patient exists
     */
    public boolean isPatientExists(String patientId) {
        try {
            Map<String, Object> patient = getPatientDetails(patientId);
            return patient != null && !patient.isEmpty();
        } catch (Exception e) {
            log.error("Error verifying patient: {}", e.getMessage());
            return false;
        }
    }
}
