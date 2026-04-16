package com.medisync.payment.dto.response;

import com.medisync.payment.enums.PaymentStatus;
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
public class PaymentResponse {

    private UUID paymentId;
    private UUID appointmentId;
    private UUID patientId;
    private UUID doctorId;
    private String stripePaymentIntentId;
    private BigDecimal amount;
    private String currency;
    private PaymentStatus status;
    private String description;
    private String failureReason;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
