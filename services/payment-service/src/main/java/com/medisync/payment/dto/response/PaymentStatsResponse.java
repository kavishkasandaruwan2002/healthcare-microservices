package com.medisync.payment.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentStatsResponse {
    private long totalPayments;
    private long successfulPayments;
    private long failedPayments;
    private long refundedPayments;
    private BigDecimal totalRevenue;
    private String currency;
}
