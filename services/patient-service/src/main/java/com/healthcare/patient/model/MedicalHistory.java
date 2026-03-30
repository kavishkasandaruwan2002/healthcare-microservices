package com.healthcare.patient.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "medical_histories")
public class MedicalHistory {
    @Id
    private String id;
    private String patientId;
    private String diagnosis;
    private String prescriptions;
    private String notes;
    private LocalDateTime date;
}
