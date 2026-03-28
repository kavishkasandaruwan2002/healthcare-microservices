package com.healthcare.patient.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PatientDTO {
    private String id;
    private String name;
    private String email;
    private String phone;
    private Integer age;
    private String gender;
    private String address;
}
