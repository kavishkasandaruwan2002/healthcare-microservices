package com.medisync.payment.dto.response;

import com.medisync.payment.enums.PaymentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentResponse {
    private UUID paymentId;
    private String appointmentId;
    private String patientId;
    private String doctorId;
    private BigDecimal amount;
    private String currency;
    private PaymentStatus status;
    private String paymentType;
    private String stripeSubscriptionId;
    private String stripeCustomerId;
    private String description;
    private String stripePaymentIntentId;
    private String failureReason;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
