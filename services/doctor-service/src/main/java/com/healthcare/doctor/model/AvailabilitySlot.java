package com.healthcare.doctor.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AvailabilitySlot {
    @Builder.Default
    private String id = UUID.randomUUID().toString();
    private String date; // Format: YYYY-MM-DD
    private String startTime; // Format: HH:MM
    private String endTime; // Format: HH:MM
    private boolean isBooked;
}
