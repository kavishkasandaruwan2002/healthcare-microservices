package com.healthcare.notification.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * JSON body DTO for the /notifications/send-prescription-email endpoint.
 * Matches exactly the payload sent by the doctor appointment frontend.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PrescriptionEmailRequest {
    private String to;
    private String subject;
    private String patientName;
    private String patientId;
    private String doctorName;
    private String doctorEmail;
    private String doctorSpecialization;
    private String diagnosis;
    private List<String> medications;
    private String dosage;
    private String duration;
    private String notes;
    private String issuedDate;
}
