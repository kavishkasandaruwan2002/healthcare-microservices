package com.healthcare.doctor.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "doctors")
public class Doctor {
    @Id
    @JsonProperty("id")
    private String id;

    private String name;

    @Indexed(unique = true)
    private String email;

    @JsonIgnore
    private String password;

    private String phone;
    private String specialization;
    private String licenseNumber;
    private String bio;
    private Double consultationFee;
    private String status;
    private List<String> availability;
    private String role;
    private String yearsOfExperience;
    private String qualification;
    private String hospitalAffiliation;
    private Boolean isVerified;
    private Long createdAt;
    private Long updatedAt;
}
