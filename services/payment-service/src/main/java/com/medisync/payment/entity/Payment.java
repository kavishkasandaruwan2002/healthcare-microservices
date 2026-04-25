package com.medisync.payment.entity;

import com.medisync.payment.enums.PaymentStatus;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "payments")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID paymentId;

    @Column(nullable = true)
    private UUID appointmentId;

    @Column(nullable = false)
    private UUID patientId;

    @Column(nullable = true)
    private UUID doctorId;

    @Column(unique = true)
    private String stripePaymentIntentId;

    private String stripeClientSecret;

    private String stripeSubscriptionId;

    private String stripeCustomerId;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Builder.Default
    @Column(nullable = false, length = 3)
    private String currency = "USD";

    @Enumerated(EnumType.STRING)
    private PaymentStatus status;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    private com.medisync.payment.enums.PaymentType paymentType = com.medisync.payment.enums.PaymentType.APPOINTMENT;

    private String description;

    private String failureReason;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}
