package com.healthcare.doctor.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "prescriptions")
public class Prescription {
    @Id
    private String id;
    private String doctorId;
    private String doctorName;
    private String doctorEmail;
    private String patientId;
    private String patientName;
    private String patientEmail;
    private String diagnosis;
    private java.util.List<String> medications;
    private String dosage;
    private String duration;
    private String notes;
    private String instructions;
    private String status;
    private String issuedDate;
    private Long dateIssued;
}
