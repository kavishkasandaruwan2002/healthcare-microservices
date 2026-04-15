package com.medisync.payment.dto.response;

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
public class PaymentInitiateResponse {

    private UUID paymentId;

    @JsonProperty("clientSecret")
    private String clientSecret;

    private BigDecimal amount;

    private String currency;

    private PaymentStatus status;

    @JsonProperty("stripePublishableKey")
    private String stripePublishableKey;
}
