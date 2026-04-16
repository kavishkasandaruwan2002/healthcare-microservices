package com.medisync.payment.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class InitiatePaymentRequest {
    @NotNull(message = "Appointment ID is required")
    private UUID appointmentId;
}
