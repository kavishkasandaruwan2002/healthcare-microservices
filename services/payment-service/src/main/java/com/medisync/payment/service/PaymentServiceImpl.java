package com.medisync.payment.service;

import jakarta.annotation.PostConstruct;

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
import com.stripe.param.PaymentIntentCreateParams;
import com.stripe.param.RefundCreateParams;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class PaymentServiceImpl implements PaymentService {

    private final PaymentRepository paymentRepository;
    private final RefundRepository refundRepository;
    private final PaymentEventPublisher paymentEventPublisher;
    private final StripeGateway stripeGateway;
    private final MeterRegistry meterRegistry;

    @Value("${stripe.publishable-key}")
    private String stripePublishableKey;

    @Value("${stripe.webhook-secret}")
    private String stripeWebhookSecret;

    @Value("${stripe.currency:USD}")
    private String defaultCurrency;

    private Counter paymentsInitiatedCounter;
    private Counter paymentsSucceededCounter;
    private Counter paymentsFailedCounter;
    private Counter refundsIssuedCounter;

    @PostConstruct
    public void initCounters() {
        this.paymentsInitiatedCounter = Counter.builder("payments_initiated_total").register(meterRegistry);
        this.paymentsSucceededCounter = Counter.builder("payments_succeeded_total").register(meterRegistry);
        this.paymentsFailedCounter = Counter.builder("payments_failed_total").register(meterRegistry);
        this.refundsIssuedCounter = Counter.builder("refunds_issued_total").register(meterRegistry);
    }

    @Override
    @Transactional(readOnly = true)
    public PaymentInitiateResponse initiatePayment(UUID appointmentId, UUID patientId) {
        Payment payment = paymentRepository.findByAppointmentId(appointmentId)
                .orElseThrow(() -> new PaymentNotFoundException(
                        "No payment found for appointment: " + appointmentId));

        if (!payment.getPatientId().equals(patientId)) {
            throw new PaymentNotFoundException("Payment not found for this patient");
        }

        if (payment.getStatus() == PaymentStatus.SUCCESS) {
            throw new PaymentAlreadyCompletedException(
                    "Payment already completed for this appointment");
        }

        paymentsInitiatedCounter.increment();

        if (payment.getStripePaymentIntentId() != null &&
            !payment.getStripePaymentIntentId().isEmpty()) {
            return PaymentInitiateResponse.builder()
                    .paymentId(payment.getPaymentId())
                    .clientSecret(payment.getStripeClientSecret())
                    .amount(payment.getAmount())
                    .currency(payment.getCurrency())
                    .status(payment.getStatus())
                    .stripePublishableKey(stripePublishableKey)
                    .build();
        }

        try {
            long amountInCents = payment.getAmount().multiply(BigDecimal.valueOf(100)).longValue();

            PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                    .setAmount(amountInCents)
                    .setCurrency(payment.getCurrency().toLowerCase())
                    .setDescription(payment.getDescription())
                    .putMetadata("appointmentId", appointmentId.toString())
                    .putMetadata("patientId", payment.getPatientId().toString())
                    .build();

            PaymentIntent intent = stripeGateway.createPaymentIntent(params);

            payment.setStripePaymentIntentId(intent.getId());
            payment.setStripeClientSecret(intent.getClientSecret());
            payment = paymentRepository.save(payment);

            return PaymentInitiateResponse.builder()
                    .paymentId(payment.getPaymentId())
                    .clientSecret(intent.getClientSecret())
                    .amount(payment.getAmount())
                    .currency(payment.getCurrency())
                    .status(payment.getStatus())
                    .stripePublishableKey(stripePublishableKey)
                    .build();

        } catch (StripeException e) {
            log.error("Failed to create Stripe PaymentIntent: {}", e.getMessage());
            throw new RuntimeException("Stripe error", e);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public PaymentResponse getPaymentById(UUID paymentId, UUID userId, String role) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new PaymentNotFoundException(
                        "Payment not found: " + paymentId));

        if (!"ADMIN".equalsIgnoreCase(role)) {
            if (!payment.getPatientId().equals(userId) && !payment.getDoctorId().equals(userId)) {
                throw new PaymentNotFoundException("Payment not found");
            }
        }

        return mapToPaymentResponse(payment);
    }

    @Override
    @Transactional(readOnly = true)
    public PaymentResponse getPaymentByAppointmentId(UUID appointmentId, UUID userId, String role) {
        Payment payment = paymentRepository.findByAppointmentId(appointmentId)
                .orElseThrow(() -> new PaymentNotFoundException(
                        "No payment found for appointment: " + appointmentId));

        if (!"ADMIN".equalsIgnoreCase(role)) {
            if (!payment.getPatientId().equals(userId) && !payment.getDoctorId().equals(userId)) {
                throw new PaymentNotFoundException("Payment not found");
            }
        }

        return mapToPaymentResponse(payment);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PaymentResponse> getMyPayments(UUID patientId, String status, Pageable pageable) {
        Page<Payment> allPayments = paymentRepository.findByPatientId(patientId, pageable);
        if (status != null && !status.isEmpty()) {
            PaymentStatus paymentStatus = PaymentStatus.valueOf(status.toUpperCase());
            java.util.List<PaymentResponse> filtered = allPayments.stream()
                    .filter(p -> p.getStatus() == paymentStatus)
                    .map(this::mapToPaymentResponse)
                    .toList();
            return new PageImpl<>(filtered, pageable, allPayments.getTotalElements());
        }
        return allPayments.map(this::mapToPaymentResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PaymentResponse> getAllPayments(String status, UUID patientId, Pageable pageable) {
        PaymentStatus paymentStatus = status != null && !status.isEmpty()
                ? PaymentStatus.valueOf(status.toUpperCase()) : null;

        Page<Payment> payments = paymentRepository.findAllWithFilters(
                paymentStatus, patientId, pageable);

        return payments.map(this::mapToPaymentResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public PaymentStatsResponse getPaymentStats() {
        long totalPayments = paymentRepository.count();
        long successfulPayments = paymentRepository.countByStatus(PaymentStatus.SUCCESS);
        long failedPayments = paymentRepository.countByStatus(PaymentStatus.FAILED);
        long refundedPayments = paymentRepository.countByStatus(PaymentStatus.REFUNDED);
        BigDecimal totalRevenue = paymentRepository.calculateTotalRevenue();

        return PaymentStatsResponse.builder()
                .totalPayments(totalPayments)
                .successfulPayments(successfulPayments)
                .failedPayments(failedPayments)
                .refundedPayments(refundedPayments)
                .totalRevenue(totalRevenue)
                .currency(defaultCurrency)
                .build();
    }

    @Override
    public RefundResponse issueRefund(UUID paymentId, RefundRequest refundRequest) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new PaymentNotFoundException(
                        "Payment not found: " + paymentId));

        if (payment.getStatus() != PaymentStatus.SUCCESS) {
            throw new InvalidPaymentStateException(
                    "Cannot refund payment with status: " + payment.getStatus());
        }

        try {
            RefundCreateParams.Builder paramsBuilder = RefundCreateParams.builder()
                    .setPaymentIntent(payment.getStripePaymentIntentId())
                    .setReason(RefundCreateParams.Reason.REQUESTED_BY_CUSTOMER);

            if (refundRequest.getAmount() != null) {
                long amountInCents = refundRequest.getAmount()
                        .multiply(BigDecimal.valueOf(100)).longValue();
                paramsBuilder.setAmount(amountInCents);
            }

            com.stripe.model.Refund stripeRefund = stripeGateway.createRefund(paramsBuilder.build());

            Refund refund = Refund.builder()
                    .payment(payment)
                    .stripeRefundId(stripeRefund.getId())
                    .amount(refundRequest.getAmount() != null
                            ? refundRequest.getAmount()
                            : payment.getAmount())
                    .reason(refundRequest.getReason())
                    .status(RefundStatus.SUCCEEDED)
                    .build();

            refundRepository.save(refund);

            if (refundRequest.getAmount() == null ||
                refund.getAmount().compareTo(payment.getAmount()) >= 0) {
                payment.setStatus(PaymentStatus.REFUNDED);
                paymentRepository.save(payment);
            }

            refundsIssuedCounter.increment();

            return mapToRefundResponse(refund);

        } catch (StripeException e) {
            log.error("Failed to create Stripe refund: {}", e.getMessage());
            throw new RuntimeException("Stripe error", e);
        }
    }

    @Override
    public void handleWebhook(String payload, String signature) throws SignatureVerificationException {
        try {
            Event event = stripeGateway.constructWebhookEvent(payload, signature, stripeWebhookSecret);
            String eventType = event.getType();

            log.info("Received Stripe webhook event: {}", eventType);

            switch (eventType) {
                case "payment_intent.succeeded":
                    handlePaymentIntentSucceeded(event);
                    break;
                case "payment_intent.payment_failed":
                    handlePaymentIntentFailed(event);
                    break;
                default:
                    log.info("Ignoring unsupported event type: {}", eventType);
            }

        } catch (SignatureVerificationException e) {
            log.error("Invalid webhook signature: {}", e.getMessage());
            throw new RuntimeException("Invalid webhook signature", e);
        } catch (Exception e) {
            log.error("Error processing webhook: {}", e.getMessage(), e);
            throw new RuntimeException("Webhook processing failed", e);
        }
    }

    private void handlePaymentIntentSucceeded(Event event) {
        PaymentIntent intent = (PaymentIntent) event.getDataObjectDeserializer().getObject()
                .orElseThrow(() -> new PaymentNotFoundException("PaymentIntent not found in event"));

        Payment payment = paymentRepository.findByStripePaymentIntentId(intent.getId())
                .orElseThrow(() -> new PaymentNotFoundException(
                        "Payment not found for Stripe PaymentIntent: " + intent.getId()));

        payment.setStatus(PaymentStatus.SUCCESS);
        paymentRepository.save(payment);

        paymentsSucceededCounter.increment();
        paymentEventPublisher.publishPaymentCompleted(payment);

        log.info("Payment succeeded: {}", payment.getPaymentId());
    }

    private void handlePaymentIntentFailed(Event event) {
        PaymentIntent intent = (PaymentIntent) event.getDataObjectDeserializer().getObject()
                .orElseThrow(() -> new PaymentNotFoundException("PaymentIntent not found in event"));

        Payment payment = paymentRepository.findByStripePaymentIntentId(intent.getId())
                .orElseThrow(() -> new PaymentNotFoundException(
                        "Payment not found for Stripe PaymentIntent: " + intent.getId()));

        String failureReason = intent.getLastPaymentError() != null
                ? intent.getLastPaymentError().getMessage()
                : "Payment failed";

        payment.setStatus(PaymentStatus.FAILED);
        payment.setFailureReason(failureReason);
        paymentRepository.save(payment);

        paymentsFailedCounter.increment();
        paymentEventPublisher.publishPaymentFailed(payment);

        log.info("Payment failed: {}, reason: {}", payment.getPaymentId(), failureReason);
    }

    private PaymentResponse mapToPaymentResponse(Payment payment) {
        return PaymentResponse.builder()
                .paymentId(payment.getPaymentId())
                .appointmentId(payment.getAppointmentId())
                .patientId(payment.getPatientId())
                .doctorId(payment.getDoctorId())
                .stripePaymentIntentId(payment.getStripePaymentIntentId())
                .amount(payment.getAmount())
                .currency(payment.getCurrency())
                .status(payment.getStatus())
                .description(payment.getDescription())
                .failureReason(payment.getFailureReason())
                .createdAt(payment.getCreatedAt())
                .updatedAt(payment.getUpdatedAt())
                .build();
    }

    private RefundResponse mapToRefundResponse(Refund refund) {
        return RefundResponse.builder()
                .refundId(refund.getRefundId())
                .paymentId(refund.getPayment().getPaymentId())
                .stripeRefundId(refund.getStripeRefundId())
                .amount(refund.getAmount())
                .status(refund.getStatus())
                .reason(refund.getReason())
                .createdAt(refund.getCreatedAt())
                .build();
    }
}
