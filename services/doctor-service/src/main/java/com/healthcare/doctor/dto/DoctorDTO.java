package com.healthcare.doctor.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;
import com.healthcare.doctor.model.AvailabilitySlot;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DoctorDTO {
    private String id;
    private String name;
    private String email;
    private String phone;
    private String specialization;
    private String bio;
    private Double consultationFee;
    private String status;
    private String yearsOfExperience;
    private String qualification;
    private String hospitalAffiliation;
    private Boolean isVerified;
    private String role;
    private List<AvailabilitySlot> availabilitySlots;
}
