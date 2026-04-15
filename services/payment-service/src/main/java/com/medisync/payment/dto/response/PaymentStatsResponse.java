package com.medisync.payment.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentStatsResponse {

    private long totalPayments;
    private long successfulPayments;
    private long failedPayments;
    private long refundedPayments;
    private BigDecimal totalRevenue;
    private String currency;
}
