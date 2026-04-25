package com.medisync.payment.messaging.event;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AppointmentConfirmedEvent {
    private String appointmentId;
    private String patientId;
    private String doctorId;
    private BigDecimal consultationFee;
    private String currency;
    private String doctorName;
    private LocalDateTime scheduledAt;
}
