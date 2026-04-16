package com.medisync.payment.messaging.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentEventPayload {
    private UUID paymentId;
    private UUID appointmentId;
    private UUID patientId;
    private UUID doctorId;
    private BigDecimal amount;
    private String currency;
    private String status;
    private String stripePaymentIntentId;
    private String failureReason;
}
