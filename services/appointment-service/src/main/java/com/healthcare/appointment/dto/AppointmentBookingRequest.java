package com.healthcare.appointment.dto;

import lombok.*;

import javax.validation.constraints.NotBlank;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AppointmentBookingRequest {

    @NotBlank(message = "Patient ID is mandatory")
    private String patientId;

    @NotBlank(message = "Doctor ID is mandatory")
    private String doctorId;

    @NotBlank(message = "Date is mandatory (format: YYYY-MM-DD)")
    private String date;

    @NotBlank(message = "Time is mandatory (format: HH:mm)")
    private String time;

    private String reason;
    
    private String appointmentType; // IN_PERSON or TELEMEDICINE
    private String notes;
}
