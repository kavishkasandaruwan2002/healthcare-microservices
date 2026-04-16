package com.medisync.payment.messaging.event;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.medisync.payment.enums.PaymentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentEventPayload {

    private UUID paymentId;
    private UUID appointmentId;
    private UUID patientId;
    private UUID doctorId;
    private BigDecimal amount;
    private String currency;
    private PaymentStatus status;

    @JsonProperty("stripePaymentIntentId")
    private String stripePaymentIntentId;
    private String failureReason;
}
