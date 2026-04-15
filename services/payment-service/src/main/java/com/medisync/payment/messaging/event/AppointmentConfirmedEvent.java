package com.medisync.payment.messaging.event;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AppointmentConfirmedEvent {

    private UUID appointmentId;
    private UUID patientId;
    private UUID doctorId;

    @JsonProperty("consultationFee")
    private BigDecimal consultationFee;
    private String currency;
    private String doctorName;
    private LocalDateTime scheduledAt;
}
