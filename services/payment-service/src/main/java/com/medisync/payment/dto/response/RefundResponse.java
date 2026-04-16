package com.medisync.payment.dto.response;

import com.medisync.payment.enums.RefundStatus;
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
public class RefundResponse {
    private UUID refundId;
    private UUID paymentId;
    private String stripeRefundId;
    private BigDecimal amount;
    private RefundStatus status;
    private String reason;
}
