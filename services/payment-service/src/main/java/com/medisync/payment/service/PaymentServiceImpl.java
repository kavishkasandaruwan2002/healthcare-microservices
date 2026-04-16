package com.medisync.payment.service;

import com.medisync.payment.dto.request.RefundRequest;
import com.medisync.payment.dto.response.PaymentInitiateResponse;
import com.medisync.payment.dto.response.PaymentResponse;
import com.medisync.payment.dto.response.PaymentStatsResponse;
import com.medisync.payment.dto.response.RefundResponse;
import com.medisync.payment.entity.Payment;
import com.medisync.payment.entity.Refund;
import com.medisync.payment.enums.PaymentStatus;
import com.medisync.payment.enums.RefundStatus;
import com.medisync.payment.exception.InvalidPaymentStateException;
import com.medisync.payment.exception.PaymentAlreadyCompletedException;
import com.medisync.payment.exception.PaymentNotFoundException;
import com.medisync.payment.messaging.PaymentEventPublisher;
import com.medisync.payment.repository.PaymentRepository;
import com.medisync.payment.repository.RefundRepository;
import com.medisync.payment.stripe.StripeGateway;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.exception.StripeException;
import com.stripe.model.Event;
import com.stripe.model.PaymentIntent;
import com.stripe.net.Webhook;
import com.stripe.param.PaymentIntentCreateParams;
import com.stripe.param.RefundCreateParams;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Slf4j
@Service
public class PaymentServiceImpl implements PaymentService {

    private final PaymentRepository paymentRepository;
    private final RefundRepository refundRepository;
    private final PaymentEventPublisher eventPublisher;
    private final StripeGateway stripeGateway;
    private final MeterRegistry meterRegistry;

    @Value("${stripe.webhook-secret}")
    private String stripeWebhookSecret;

    @Value("${stripe.publishable-key}")
    private String stripePublishableKey;

    @Value("${stripe.currency:USD}")
    private String defaultCurrency;

    // Micrometer metrics
    private final Counter paymentsInitiatedCounter;
    private final Counter paymentsSucceededCounter;
    private final Counter paymentsFailedCounter;
    private final Counter refundsIssuedCounter;

    public PaymentServiceImpl(PaymentRepository paymentRepository, 
                              RefundRepository refundRepository, 
                              PaymentEventPublisher eventPublisher, 
                              MeterRegistry meterRegistry,
                              StripeGateway stripeGateway) {
        this.paymentRepository = paymentRepository;
        this.refundRepository = refundRepository;
        this.eventPublisher = eventPublisher;
        this.meterRegistry = meterRegistry;
        this.stripeGateway = stripeGateway;

        this.paymentsInitiatedCounter = meterRegistry.counter("payment.initiated");
        this.paymentsSucceededCounter = meterRegistry.counter("payment.succeeded");
        this.paymentsFailedCounter = meterRegistry.counter("payment.failed");
        this.refundsIssuedCounter = meterRegistry.counter("payment.refunded");
        
        meterRegistry.gauge("payment.total.revenue", this, 
                service -> paymentRepository.calculateTotalRevenue().doubleValue());
    }

    @Override
    @Transactional
    public PaymentInitiateResponse initiatePayment(UUID appointmentId, UUID patientId) {
        Payment payment = paymentRepository.findByAppointmentId(appointmentId)
                .orElseThrow(() -> new PaymentNotFoundException("Payment record not found for appointment: " + appointmentId));

        if (payment.getStatus() == PaymentStatus.SUCCESS) {
            throw new PaymentAlreadyCompletedException("Payment already completed for this appointment");
        }

        if (payment.getStripePaymentIntentId() == null) {
            try {
                long amountInCents = payment.getAmount().multiply(new BigDecimal(100)).longValue();
                
                PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                        .setAmount(amountInCents)
                        .setCurrency(payment.getCurrency().toLowerCase())
                        .setDescription(payment.getDescription())
                        .putMetadata("appointmentId", appointmentId.toString())
                        .putMetadata("patientId", patientId.toString())
                        .build();

                PaymentIntent intent = stripeGateway.createPaymentIntent(params);
                
                payment.setStripePaymentIntentId(intent.getId());
                payment.setStripeClientSecret(intent.getClientSecret());
                paymentRepository.save(payment);
                
                paymentsInitiatedCounter.increment();
            } catch (StripeException e) {
                log.error("Stripe error creating PaymentIntent", e);
                throw new RuntimeException("Payment gateway error: " + e.getMessage());
            }
        }

        return PaymentInitiateResponse.builder()
                .paymentId(payment.getPaymentId())
                .clientSecret(payment.getStripeClientSecret())
                .amount(payment.getAmount())
                .currency(payment.getCurrency())
                .status(payment.getStatus().name())
                .stripePublishableKey(stripePublishableKey)
                .build();
    }

    @Override
    @Transactional
    public void handleWebhook(String payload, String sigHeader) throws SignatureVerificationException {
        Event event = stripeGateway.constructWebhookEvent(payload, sigHeader, stripeWebhookSecret);

        log.info("Handling Stripe Webhook event: {}", event.getType());

        if ("payment_intent.succeeded".equals(event.getType())) {
            PaymentIntent intent = (PaymentIntent) event.getDataObjectDeserializer().getObject()
                    .orElseThrow(() -> new RuntimeException("Failed to deserialize PaymentIntent"));
            
            updatePaymentStatus(intent.getId(), PaymentStatus.SUCCESS, null);
            paymentsSucceededCounter.increment();
            
        } else if ("payment_intent.payment_failed".equals(event.getType())) {
            PaymentIntent intent = (PaymentIntent) event.getDataObjectDeserializer().getObject()
                    .orElseThrow(() -> new RuntimeException("Failed to deserialize PaymentIntent"));
            
            String reason = intent.getLastPaymentError() != null ? intent.getLastPaymentError().getMessage() : "Unknown error";
            updatePaymentStatus(intent.getId(), PaymentStatus.FAILED, reason);
            paymentsFailedCounter.increment();
        }
    }

    private void updatePaymentStatus(String intentId, PaymentStatus status, String failureReason) {
        Payment payment = paymentRepository.findByStripePaymentIntentId(intentId)
                .orElseThrow(() -> new PaymentNotFoundException("Payment not found for Intent ID: " + intentId));

        payment.setStatus(status);
        payment.setFailureReason(failureReason);
        paymentRepository.save(payment);

        if (status == PaymentStatus.SUCCESS) {
            eventPublisher.publishPaymentCompleted(payment);
        } else if (status == PaymentStatus.FAILED) {
            eventPublisher.publishPaymentFailed(payment);
        }
    }

    @Override
    public PaymentResponse getPaymentById(UUID paymentId, UUID userId, String role) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new PaymentNotFoundException("Payment not found"));

        validateAccess(payment, userId, role);
        return mapToResponse(payment);
    }

    @Override
    public PaymentResponse getPaymentByAppointmentId(UUID appointmentId, UUID userId, String role) {
        Payment payment = paymentRepository.findByAppointmentId(appointmentId)
                .orElseThrow(() -> new PaymentNotFoundException("Payment not found for appointment"));

        validateAccess(payment, userId, role);
        return mapToResponse(payment);
    }

    private void validateAccess(Payment payment, UUID userId, String role) {
        boolean isAdmin = role.contains("ADMIN");
        boolean isDoctor = role.contains("DOCTOR") && payment.getDoctorId().equals(userId);
        boolean isPatient = role.contains("PATIENT") && payment.getPatientId().equals(userId);

        if (!isAdmin && !isDoctor && !isPatient) {
            throw new AccessDeniedException("You do not have permission to view this payment");
        }
    }

    @Override
    public Page<PaymentResponse> getMyPayments(UUID patientId, String status, Pageable pageable) {
        PaymentStatus s = status != null ? PaymentStatus.valueOf(status.toUpperCase()) : null;
        return paymentRepository.findAllWithFilters(s, patientId, pageable).map(this::mapToResponse);
    }

    @Override
    @Transactional
    public RefundResponse issueRefund(UUID paymentId, RefundRequest request) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new PaymentNotFoundException("Payment not found"));

        if (payment.getStatus() != PaymentStatus.SUCCESS) {
            throw new InvalidPaymentStateException("Only successful payments can be refunded");
        }

        try {
            RefundCreateParams.Builder paramsBuilder = RefundCreateParams.builder()
                    .setPaymentIntent(payment.getStripePaymentIntentId());

            BigDecimal refundAmount = payment.getAmount();
            if (request.getAmount() != null) {
                refundAmount = request.getAmount();
                paramsBuilder.setAmount(refundAmount.multiply(new BigDecimal(100)).longValue());
            }
            
            paramsBuilder.setReason(RefundCreateParams.Reason.REQUESTED_BY_CUSTOMER);
            
            com.stripe.model.Refund stripeRefund = stripeGateway.createRefund(paramsBuilder.build());

            Refund refund = Refund.builder()
                    .payment(payment)
                    .stripeRefundId(stripeRefund.getId())
                    .amount(refundAmount)
                    .reason(request.getReason())
                    .status(RefundStatus.SUCCEEDED)
                    .createdAt(LocalDateTime.now())
                    .build();

            refundRepository.save(refund);

            if (refundAmount.compareTo(payment.getAmount()) >= 0) {
                payment.setStatus(PaymentStatus.REFUNDED);
                paymentRepository.save(payment);
            }

            refundsIssuedCounter.increment();

            return RefundResponse.builder()
                    .refundId(refund.getRefundId())
                    .paymentId(payment.getPaymentId())
                    .stripeRefundId(stripeRefund.getId())
                    .amount(refundAmount)
                    .status(refund.getStatus())
                    .reason(refund.getReason())
                    .build();

        } catch (StripeException e) {
            log.error("Stripe refund error", e);
            throw new RuntimeException("Refund failed: " + e.getMessage());
        }
    }

    @Override
    public Page<PaymentResponse> getAllPayments(String status, UUID patientId, Pageable pageable) {
        PaymentStatus s = status != null ? PaymentStatus.valueOf(status.toUpperCase()) : null;
        return paymentRepository.findAllWithFilters(s, patientId, pageable).map(this::mapToResponse);
    }

    @Override
    public PaymentStatsResponse getPaymentStats() {
        return PaymentStatsResponse.builder()
                .totalPayments(paymentRepository.count())
                .successfulPayments(paymentRepository.countByStatus(PaymentStatus.SUCCESS))
                .failedPayments(paymentRepository.countByStatus(PaymentStatus.FAILED))
                .refundedPayments(paymentRepository.countByStatus(PaymentStatus.REFUNDED))
                .totalRevenue(paymentRepository.calculateTotalRevenue())
                .currency(defaultCurrency)
                .build();
    }

    private PaymentResponse mapToResponse(Payment payment) {
        return PaymentResponse.builder()
                .paymentId(payment.getPaymentId())
                .appointmentId(payment.getAppointmentId())
                .patientId(payment.getPatientId())
                .doctorId(payment.getDoctorId())
                .amount(payment.getAmount())
                .currency(payment.getCurrency())
                .status(payment.getStatus())
                .description(payment.getDescription())
                .stripePaymentIntentId(payment.getStripePaymentIntentId())
                .failureReason(payment.getFailureReason())
                .createdAt(payment.getCreatedAt())
                .updatedAt(payment.getUpdatedAt())
                .build();
    }
}
