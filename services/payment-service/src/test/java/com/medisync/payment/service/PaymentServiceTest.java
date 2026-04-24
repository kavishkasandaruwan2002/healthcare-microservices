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
import com.medisync.payment.security.UserPrincipal;
import com.medisync.payment.stripe.StripeGateway;
import org.springframework.security.access.AccessDeniedException;
import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.ArgumentMatchers.anyString;

@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private RefundRepository refundRepository;

    @Mock
    private PaymentEventPublisher paymentEventPublisher;

    @Mock
    private StripeGateway stripeGateway;

    @Mock
    private MeterRegistry meterRegistry;

    @Mock
    private Counter counter;

    @InjectMocks
    private PaymentServiceImpl paymentService;

    private UUID paymentId;
    private UUID appointmentId;
    private UUID patientId;
    private UUID doctorId;

    @BeforeEach
    void setUp() {
        paymentId = UUID.randomUUID();
        appointmentId = UUID.randomUUID();
        patientId = UUID.randomUUID();
        doctorId = UUID.randomUUID();

        lenient().when(meterRegistry.counter(anyString())).thenReturn(counter);
        ReflectionTestUtils.setField(paymentService, "stripeWebhookSecret", "whsec_test");
        ReflectionTestUtils.setField(paymentService, "stripePublishableKey", "pk_test_123");
        ReflectionTestUtils.setField(paymentService, "paymentsInitiatedCounter", counter);
        ReflectionTestUtils.setField(paymentService, "paymentsSucceededCounter", counter);
        ReflectionTestUtils.setField(paymentService, "paymentsFailedCounter", counter);
        ReflectionTestUtils.setField(paymentService, "refundsIssuedCounter", counter);
    }

    @Test
    void initiatePayment_newIntent_createsStripeIntent() throws StripeException {
        Payment payment = Payment.builder()
                .paymentId(paymentId)
                .appointmentId(appointmentId)
                .patientId(patientId)
                .doctorId(doctorId)
                .amount(BigDecimal.valueOf(25.00))
                .currency("USD")
                .status(PaymentStatus.PENDING)
                .description("Consultation fee - Dr. Smith")
                .stripePaymentIntentId(null)
                .stripeClientSecret(null)
                .build();

        when(paymentRepository.findByAppointmentId(appointmentId)).thenReturn(Optional.of(payment));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        PaymentIntent mockIntent = mock(PaymentIntent.class);
        when(mockIntent.getId()).thenReturn("pi_test123");
        when(mockIntent.getClientSecret()).thenReturn("pi_test123_secret_abc");
        when(stripeGateway.createPaymentIntent(any())).thenReturn(mockIntent);

        PaymentInitiateResponse response = paymentService.initiatePayment(appointmentId, patientId);

        assertNotNull(response);
        assertEquals("pi_test123_secret_abc", response.getClientSecret());
        assertEquals(PaymentStatus.PENDING.name(), response.getStatus());
        verify(paymentRepository).save(argThat(p ->
                p.getStripePaymentIntentId().equals("pi_test123") &&
                p.getStripeClientSecret().equals("pi_test123_secret_abc")
        ));
    }

    @Test
    void initiatePayment_alreadySuccess_throwsConflict() {
        Payment payment = Payment.builder()
                .paymentId(paymentId)
                .appointmentId(appointmentId)
                .patientId(patientId)
                .doctorId(doctorId)
                .amount(BigDecimal.valueOf(25.00))
                .currency("USD")
                .status(PaymentStatus.SUCCESS)
                .stripePaymentIntentId("pi_test123")
                .stripeClientSecret("pi_test123_secret_abc")
                .build();

        when(paymentRepository.findByAppointmentId(appointmentId)).thenReturn(Optional.of(payment));

        assertThrows(PaymentAlreadyCompletedException.class, () ->
                paymentService.initiatePayment(appointmentId, patientId));
    }

    @Test
    void initiatePayment_alreadyHasIntent_returnsExistingClientSecret() {
        Payment payment = Payment.builder()
                .paymentId(paymentId)
                .appointmentId(appointmentId)
                .patientId(patientId)
                .doctorId(doctorId)
                .amount(BigDecimal.valueOf(25.00))
                .currency("USD")
                .status(PaymentStatus.PENDING)
                .stripePaymentIntentId("pi_test123")
                .stripeClientSecret("pi_test123_secret_abc")
                .build();

        when(paymentRepository.findByAppointmentId(appointmentId)).thenReturn(Optional.of(payment));

        PaymentInitiateResponse response = paymentService.initiatePayment(appointmentId, patientId);

        assertNotNull(response);
        assertEquals("pi_test123_secret_abc", response.getClientSecret());
        verify(paymentRepository, never()).save(any());
    }

    @Test
    void handleWebhook_paymentSucceeded_updatesStatusAndPublishesEvent() throws com.stripe.exception.SignatureVerificationException {
        String payload = "{\"id\":\"evt_123\",\"type\":\"payment_intent.succeeded\",\"data\":{\"object\":{\"id\":\"pi_test123\"}}}";
        String signature = "t=1234567890,v1=abc123";

        Payment payment = Payment.builder()
                .paymentId(paymentId)
                .appointmentId(appointmentId)
                .patientId(patientId)
                .doctorId(doctorId)
                .amount(BigDecimal.valueOf(25.00))
                .currency("USD")
                .status(PaymentStatus.PENDING)
                .stripePaymentIntentId("pi_test123")
                .build();

        com.stripe.model.Event mockEvent = mock(com.stripe.model.Event.class);
        com.stripe.model.EventDataObjectDeserializer deserializer = mock(com.stripe.model.EventDataObjectDeserializer.class);
        PaymentIntent intent = mock(PaymentIntent.class);

        when(mockEvent.getType()).thenReturn("payment_intent.succeeded");
        when(mockEvent.getDataObjectDeserializer()).thenReturn(deserializer);
        when(deserializer.getObject()).thenReturn(Optional.of(intent));
        when(intent.getId()).thenReturn("pi_test123");

        when(stripeGateway.constructWebhookEvent(payload, signature, "whsec_test")).thenReturn(mockEvent);
        when(paymentRepository.findByStripePaymentIntentId("pi_test123")).thenReturn(Optional.of(payment));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        paymentService.handleWebhook(payload, signature);

        verify(paymentRepository).save(argThat(p -> p.getStatus() == PaymentStatus.SUCCESS));
        verify(paymentEventPublisher).publishPaymentCompleted(any(Payment.class));
    }

    @Test
    void handleWebhook_paymentFailed_updatesStatusAndPublishesEvent() throws com.stripe.exception.SignatureVerificationException {
        String payload = "{\"id\":\"evt_123\",\"type\":\"payment_intent.payment_failed\",\"data\":{\"object\":{\"id\":\"pi_test123\",\"last_payment_error\":{\"message\":\"Card declined\"}}}}";
        String signature = "t=1234567890,v1=abc123";

        Payment payment = Payment.builder()
                .paymentId(paymentId)
                .appointmentId(appointmentId)
                .patientId(patientId)
                .doctorId(doctorId)
                .amount(BigDecimal.valueOf(25.00))
                .currency("USD")
                .status(PaymentStatus.PENDING)
                .stripePaymentIntentId("pi_test123")
                .build();

        com.stripe.model.Event mockEvent = mock(com.stripe.model.Event.class);
        com.stripe.model.EventDataObjectDeserializer deserializer = mock(com.stripe.model.EventDataObjectDeserializer.class);
        PaymentIntent intent = mock(PaymentIntent.class);
        com.stripe.model.StripeError error = mock(com.stripe.model.StripeError.class);

        when(mockEvent.getType()).thenReturn("payment_intent.payment_failed");
        when(mockEvent.getDataObjectDeserializer()).thenReturn(deserializer);
        when(deserializer.getObject()).thenReturn(Optional.of(intent));
        when(intent.getId()).thenReturn("pi_test123");
        when(intent.getLastPaymentError()).thenReturn(error);
        when(error.getMessage()).thenReturn("Card declined");

        when(stripeGateway.constructWebhookEvent(payload, signature, "whsec_test")).thenReturn(mockEvent);
        when(paymentRepository.findByStripePaymentIntentId("pi_test123")).thenReturn(Optional.of(payment));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        paymentService.handleWebhook(payload, signature);

        verify(paymentRepository).save(argThat(p ->
                p.getStatus() == PaymentStatus.FAILED &&
                        p.getFailureReason().equals("Card declined")
        ));
        verify(paymentEventPublisher).publishPaymentFailed(any(Payment.class));
    }

    @Test
    void refund_fullRefund_success() throws StripeException {
        Payment payment = Payment.builder()
                .paymentId(paymentId)
                .appointmentId(appointmentId)
                .patientId(patientId)
                .doctorId(doctorId)
                .amount(BigDecimal.valueOf(25.00))
                .currency("USD")
                .status(PaymentStatus.SUCCESS)
                .stripePaymentIntentId("pi_test123")
                .build();

        RefundRequest refundRequest = new RefundRequest(null, "Patient cancelled appointment");

        when(paymentRepository.findById(paymentId)).thenReturn(Optional.of(payment));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(refundRepository.save(any(Refund.class))).thenAnswer(invocation -> invocation.getArgument(0));

        com.stripe.model.Refund mockRefund = mock(com.stripe.model.Refund.class);
        when(mockRefund.getId()).thenReturn("re_test123");
        when(stripeGateway.createRefund(any())).thenReturn(mockRefund);

        RefundResponse response = paymentService.issueRefund(paymentId, refundRequest);

        assertNotNull(response);
        assertEquals("re_test123", response.getStripeRefundId());
        assertEquals(RefundStatus.SUCCEEDED, response.getStatus());
        verify(paymentRepository).save(argThat(p -> p.getStatus() == PaymentStatus.REFUNDED));
    }

    @Test
    void refund_paymentNotSuccess_throwsInvalidState() {
        Payment payment = Payment.builder()
                .paymentId(paymentId)
                .appointmentId(appointmentId)
                .patientId(patientId)
                .doctorId(doctorId)
                .amount(BigDecimal.valueOf(25.00))
                .currency("USD")
                .status(PaymentStatus.PENDING)
                .stripePaymentIntentId("pi_test123")
                .build();

        RefundRequest refundRequest = new RefundRequest(BigDecimal.valueOf(25.00), "Test refund");

        when(paymentRepository.findById(paymentId)).thenReturn(Optional.of(payment));

        assertThrows(InvalidPaymentStateException.class, () ->
                paymentService.issueRefund(paymentId, refundRequest));
    }

    @Test
    void getStats_returnsCorrectValues() {
        when(paymentRepository.count()).thenReturn(200L);
        when(paymentRepository.countByStatus(PaymentStatus.SUCCESS)).thenReturn(185L);
        when(paymentRepository.countByStatus(PaymentStatus.FAILED)).thenReturn(10L);
        when(paymentRepository.countByStatus(PaymentStatus.REFUNDED)).thenReturn(5L);
        when(paymentRepository.calculateTotalRevenue()).thenReturn(BigDecimal.valueOf(4625.00));

        PaymentStatsResponse response = paymentService.getPaymentStats();

        assertNotNull(response);
        assertEquals(200, response.getTotalPayments());
        assertEquals(185, response.getSuccessfulPayments());
        assertEquals(10, response.getFailedPayments());
        assertEquals(5, response.getRefundedPayments());
        assertEquals(BigDecimal.valueOf(4625.00), response.getTotalRevenue());
    }

    @Test
    void getPaymentById_asOwner_returnsPayment() {
        Payment payment = Payment.builder()
                .paymentId(paymentId)
                .appointmentId(appointmentId)
                .patientId(patientId)
                .doctorId(doctorId)
                .amount(BigDecimal.valueOf(25.00))
                .currency("USD")
                .status(PaymentStatus.SUCCESS)
                .build();

        when(paymentRepository.findById(paymentId)).thenReturn(Optional.of(payment));

        PaymentResponse response = paymentService.getPaymentById(paymentId, patientId, "PATIENT");

        assertNotNull(response);
        assertEquals(paymentId, response.getPaymentId());
    }

    @Test
    void getPaymentById_asOtherPatient_throwsAccessDenied() {
        Payment payment = Payment.builder()
                .paymentId(paymentId)
                .appointmentId(appointmentId)
                .patientId(patientId)
                .doctorId(doctorId)
                .amount(BigDecimal.valueOf(25.00))
                .currency("USD")
                .status(PaymentStatus.SUCCESS)
                .build();

        UUID otherPatientId = UUID.randomUUID();
        when(paymentRepository.findById(paymentId)).thenReturn(Optional.of(payment));

        assertThrows(AccessDeniedException.class, () ->
                paymentService.getPaymentById(paymentId, otherPatientId, "PATIENT"));
    }
}
