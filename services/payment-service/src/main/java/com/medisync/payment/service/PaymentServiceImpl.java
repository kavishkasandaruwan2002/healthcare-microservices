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
import com.medisync.payment.enums.PaymentType;
import com.stripe.model.Charge;
import com.stripe.model.Invoice;
import com.stripe.model.Subscription;
import com.stripe.model.checkout.Session;
import com.stripe.param.checkout.SessionCreateParams;
import java.math.BigDecimal;
import com.medisync.payment.messaging.PaymentEventPublisher;
import com.medisync.payment.repository.PaymentRepository;
import com.medisync.payment.repository.RefundRepository;
import com.medisync.payment.stripe.StripeGateway;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.exception.StripeException;
import com.stripe.model.Event;
import com.stripe.model.EventDataObjectDeserializer;
import com.stripe.model.PaymentIntent;
import com.stripe.model.StripeObject;
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
    public PaymentInitiateResponse initiatePayment(String appointmentId, String patientId) {
        Payment payment = paymentRepository.findByAppointmentId(appointmentId)
                .orElseThrow(() -> new PaymentNotFoundException("Payment record not found for appointment: " + appointmentId));

        if (payment.getStatus() == PaymentStatus.SUCCESS) {
            throw new PaymentAlreadyCompletedException("Payment already completed for this appointment");
        }

        try {
            long amountInCents = payment.getAmount().multiply(new BigDecimal(100)).longValue();
            
            SessionCreateParams params = SessionCreateParams.builder()
                    .setMode(SessionCreateParams.Mode.PAYMENT)
                    .setSuccessUrl("http://localhost:3001/patient/dashboard?payment=success&appointmentId=" + appointmentId)
                    .setCancelUrl("http://localhost:3001/patient/payment?appointmentId=" + appointmentId + "&error=cancelled")
                    .addLineItem(
                            SessionCreateParams.LineItem.builder()
                                    .setQuantity(1L)
                                    .setPriceData(
                                            SessionCreateParams.LineItem.PriceData.builder()
                                                    .setCurrency(payment.getCurrency().toLowerCase())
                                                    .setUnitAmount(amountInCents)
                                                    .setProductData(
                                                            SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                                                    .setName("Doctor Consultation - " + payment.getDescription())
                                                                    .build()
                                                    )
                                                    .build()
                                    )
                                    .build()
                    )
                    .putMetadata("appointmentId", appointmentId)
                    .putMetadata("patientId", patientId)
                    .build();

            Session session = stripeGateway.createCheckoutSession(params);
            
            // Note: In Checkout, the PaymentIntent is created AFTER the session is started/completed
            // For now, we store the Session ID to track it
            payment.setStripeClientSecret(session.getId()); 
            paymentRepository.save(payment);
            
            paymentsInitiatedCounter.increment();
            
            return PaymentInitiateResponse.builder()
                    .paymentId(payment.getPaymentId())
                    .checkoutUrl(session.getUrl())
                    .amount(payment.getAmount())
                    .currency(payment.getCurrency())
                    .status(payment.getStatus().name())
                    .stripePublishableKey(stripePublishableKey)
                    .build();
        } catch (StripeException e) {
            log.error("Stripe error creating Checkout Session", e);
            throw new RuntimeException("Payment gateway error: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public void handleWebhook(String payload, String sigHeader) throws SignatureVerificationException {
        try {
            Event event = stripeGateway.constructWebhookEvent(payload, sigHeader, stripeWebhookSecret);
            log.info("WEBHOOK_TYPE: {}", event.getType());
            
            EventDataObjectDeserializer deserializer = event.getDataObjectDeserializer();
            StripeObject stripeObject = deserializer.getObject().orElse(null);
            
            // Fail-safe: if the primary deserializer fails, try to get the raw object (useful for version mismatches)
            if (stripeObject == null) {
                log.warn("WEBHOOK_WARN: Primary deserializer returned empty for {}. Attempting fail-safe.", event.getType());
            }

            if ("payment_intent.succeeded".equals(event.getType())) {
                PaymentIntent intent = (PaymentIntent) stripeObject;
                if (intent == null) {
                    // Manual extraction if deserializer failed
                    String rawJson = deserializer.getRawJson();
                    intent = com.stripe.net.ApiResource.GSON.fromJson(rawJson, PaymentIntent.class);
                }
                if (intent != null) {
                    updatePaymentStatus(intent.getId(), PaymentStatus.SUCCESS, null, intent);
                }
            } else if ("charge.succeeded".equals(event.getType())) {
                Charge charge = (Charge) stripeObject;
                if (charge == null) {
                    charge = com.stripe.net.ApiResource.GSON.fromJson(deserializer.getRawJson(), Charge.class);
                }
                if (charge != null && charge.getPaymentIntent() != null) {
                    updatePaymentStatus(charge.getPaymentIntent(), PaymentStatus.SUCCESS, null, null);
                }
            } else if ("invoice.payment_succeeded".equals(event.getType()) || "invoice.paid".equals(event.getType())) {
                Invoice invoice = (Invoice) stripeObject;
                if (invoice == null) {
                    invoice = com.stripe.net.ApiResource.GSON.fromJson(deserializer.getRawJson(), Invoice.class);
                }
                if (invoice != null && invoice.getPaymentIntent() != null) {
                    updatePaymentStatus(invoice.getPaymentIntent(), PaymentStatus.SUCCESS, null, null);
                }
            } else if ("checkout.session.completed".equals(event.getType())) {
                Session session = (Session) stripeObject;
                if (session == null) {
                    session = com.stripe.net.ApiResource.GSON.fromJson(deserializer.getRawJson(), Session.class);
                }
                if (session != null && session.getPaymentIntent() != null) {
                    updatePaymentStatus(session.getPaymentIntent(), PaymentStatus.SUCCESS, null, null);
                }
            } else {
                log.info("WEBHOOK_IGNORED: {}", event.getType());
            }
        } catch (Throwable t) {
            log.error("WEBHOOK_EXCEPTION: ", t);
        }
    }

    private void handleSubscriptionPayment(Invoice invoice) {
        log.info("Handling subscription payment for invoice: {}", invoice.getId());
        
        String patientIdStr = invoice.getMetadata() != null ? invoice.getMetadata().get("patientId") : null;
        
        // 1. Try metadata
        if (patientIdStr == null && invoice.getSubscription() != null) {
            // Try customer lookup in our DB first (more efficient)
            patientIdStr = paymentRepository.findFirstByStripeCustomerIdOrderByCreatedAtDesc(invoice.getCustomer())
                    .map(p -> p.getPatientId().toString())
                    .orElse(null);
            
            // 2. If still null, hit Stripe API (fallback)
            if (patientIdStr == null) {
                try {
                    Subscription sub = Subscription.retrieve(invoice.getSubscription());
                    patientIdStr = sub.getMetadata().get("patientId");
                } catch (Exception e) {
                    log.warn("Could not retrieve subscription metadata for {}", invoice.getSubscription());
                }
            }
        }

        if (patientIdStr == null) {
            log.warn("No patientId found for invoice {}. Cannot save to DB.", invoice.getId());
            return;
        }

        Payment payment = Payment.builder()
                .patientId(patientIdStr)
                .amount(BigDecimal.valueOf(invoice.getAmountPaid()).divide(BigDecimal.valueOf(100)))
                .currency(invoice.getCurrency().toUpperCase())
                .status(PaymentStatus.SUCCESS)
                .paymentType(PaymentType.SUBSCRIPTION)
                .stripeCustomerId(invoice.getCustomer())
                .stripeSubscriptionId(invoice.getSubscription())
                .description("Subscription Payment - " + invoice.getNumber())
                .createdAt(LocalDateTime.now())
                .build();

        paymentRepository.save(payment);
        log.info("Saved subscription payment to DB for patient: {}", patientIdStr);
        eventPublisher.publishPaymentCompleted(payment);
    }

    private void updatePaymentStatus(String intentId, PaymentStatus status, String failureReason, PaymentIntent intent) {
        log.info("WEBHOOK_DB: Searching for payment with intent ID: {}", intentId);
        
        Payment payment = paymentRepository.findByStripePaymentIntentId(intentId).orElse(null);

        if (payment == null) {
            log.info("WEBHOOK_DB: Payment not found for intent {}. Creating a new one for logging purposes.", intentId);
            
            String patientIdStr = (intent != null && intent.getMetadata() != null) ? intent.getMetadata().get("patientId") : null;
            String patientId = null;
            
            if (patientIdStr != null) {
                patientId = patientIdStr;
            }
            
            if (patientId == null) {
                patientId = "00000000-0000-0000-0000-000000000000";
            }

            payment = Payment.builder()
                    .stripePaymentIntentId(intentId)
                    .patientId(patientId)
                    .amount(intent != null ? BigDecimal.valueOf(intent.getAmount()).divide(BigDecimal.valueOf(100)) : BigDecimal.ZERO)
                    .currency(intent != null ? intent.getCurrency().toUpperCase() : "USD")
                    .status(status)
                    .description("Auto-created from webhook: " + intentId)
                    .paymentType(PaymentType.APPOINTMENT)
                    .createdAt(LocalDateTime.now())
                    .build();
        } else {
            log.info("WEBHOOK_DB: Found existing payment record. Updating status.");
            payment.setStatus(status);
        }

        if (failureReason != null) {
            payment.setFailureReason(failureReason);
        }
        
        paymentRepository.save(payment);

        if (status == PaymentStatus.SUCCESS) {
            eventPublisher.publishPaymentCompleted(payment);
        } else if (status == PaymentStatus.FAILED) {
            eventPublisher.publishPaymentFailed(payment);
        }
    }

    @Override
    public PaymentResponse getPaymentById(UUID paymentId, String userId, String role) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new PaymentNotFoundException("Payment not found"));

        validateAccess(payment, userId, role);
        return mapToResponse(payment);
    }

    @Override
    public PaymentResponse getPaymentByAppointmentId(String appointmentId, String userId, String role) {
        Payment payment = paymentRepository.findByAppointmentId(appointmentId)
                .orElseThrow(() -> new PaymentNotFoundException("Payment not found for appointment"));

        validateAccess(payment, userId, role);
        return mapToResponse(payment);
    }

    private void validateAccess(Payment payment, String userId, String role) {
        boolean isAdmin = role.contains("ADMIN");
        boolean isDoctor = role.contains("DOCTOR") && payment.getDoctorId().equals(userId);
        boolean isPatient = role.contains("PATIENT") && payment.getPatientId().equals(userId);

        if (!isAdmin && !isDoctor && !isPatient) {
            throw new AccessDeniedException("You do not have permission to view this payment");
        }
    }

    @Override
    public Page<PaymentResponse> getMyPayments(String patientId, String status, Pageable pageable) {
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
    public Page<PaymentResponse> getAllPayments(String status, String patientId, Pageable pageable) {
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
                .paymentType(payment.getPaymentType() != null ? payment.getPaymentType().name() : null)
                .stripeSubscriptionId(payment.getStripeSubscriptionId())
                .stripeCustomerId(payment.getStripeCustomerId())
                .description(payment.getDescription())
                .stripePaymentIntentId(payment.getStripePaymentIntentId())
                .failureReason(payment.getFailureReason())
                .createdAt(payment.getCreatedAt())
                .updatedAt(payment.getUpdatedAt())
                .build();
    }
}
