# Appendix: Integrated Healthcare Platform - Payment & Telemedicine

This appendix contains the core source code for the Payment and Telemedicine services, covering both Backend (Spring Boot) and Frontend (Next.js) implementations.

## 1. Payment Service (Backend)

### Controller: PaymentController.java
**Path:** `services/payment-service/src/main/java/com/medisync/payment/controller/PaymentController.java`
```java
package com.medisync.payment.controller;

import com.medisync.payment.dto.request.InitiatePaymentRequest;
import com.medisync.payment.dto.request.RefundRequest;
import com.medisync.payment.dto.response.PaymentInitiateResponse;
import com.medisync.payment.dto.response.PaymentResponse;
import com.medisync.payment.dto.response.PaymentStatsResponse;
import com.medisync.payment.dto.response.RefundResponse;
import com.medisync.payment.security.UserPrincipal;
import com.medisync.payment.service.PaymentService;
import com.stripe.exception.SignatureVerificationException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
@Tag(name = "Payment", description = "Payment management APIs")
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/initiate")
    @PreAuthorize("hasRole('PATIENT')")
    @Operation(summary = "Initiate a payment", description = "Creates a Stripe PaymentIntent and returns clientSecret to frontend")
    public ResponseEntity<PaymentInitiateResponse> initiatePayment(
            @Valid @RequestBody InitiatePaymentRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        log.info("Initiating payment for appointment: {}, patient: {}",
                request.getAppointmentId(), userPrincipal.getUserId());

        PaymentInitiateResponse response = paymentService.initiatePayment(
                request.getAppointmentId(),
                UUID.fromString(userPrincipal.getUserId()));

        return ResponseEntity.ok(response);
    }

    @PostMapping(value = "/webhook", consumes = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Stripe webhook endpoint", description = "Handles Stripe webhook events")
    public ResponseEntity<Map<String, Boolean>> handleStripeWebhook(
            @RequestBody String payload,
            @RequestHeader("Stripe-Signature") String stripeSignature) {

        log.info("Received Stripe webhook");
        try {
            paymentService.handleWebhook(payload, stripeSignature);
            return ResponseEntity.ok(Map.of("received", true));
        } catch (SignatureVerificationException e) {
            log.error("Invalid webhook signature", e);
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/{paymentId}")
    @Operation(summary = "Get payment by ID")
    public ResponseEntity<PaymentResponse> getPaymentById(
            @PathVariable UUID paymentId,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        PaymentResponse response = paymentService.getPaymentById(
                paymentId,
                UUID.fromString(userPrincipal.getUserId()),
                userPrincipal.getRole());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/appointment/{appointmentId}")
    public ResponseEntity<PaymentResponse> getPaymentByAppointmentId(
            @PathVariable UUID appointmentId,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        PaymentResponse response = paymentService.getPaymentByAppointmentId(
                appointmentId,
                UUID.fromString(userPrincipal.getUserId()),
                userPrincipal.getRole());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/my-payments")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<Page<PaymentResponse>> getMyPayments(
            @RequestParam(required = false) String status,
            @PageableDefault(size = 10) Pageable pageable,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        Page<PaymentResponse> response = paymentService.getMyPayments(
                UUID.fromString(userPrincipal.getUserId()),
                status,
                pageable);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/{paymentId}/refund")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<RefundResponse> issueRefund(
            @PathVariable UUID paymentId,
            @Valid @RequestBody(required = false) RefundRequest refundRequest) {

        if (refundRequest == null) {
            refundRequest = new RefundRequest();
            refundRequest.setReason("Admin initiated refund");
        }

        RefundResponse response = paymentService.issueRefund(paymentId, refundRequest);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PaymentStatsResponse> getPaymentStats() {
        return ResponseEntity.ok(paymentService.getPaymentStats());
    }
}
```

### Service: PaymentServiceImpl.java
**Path:** `services/payment-service/src/main/java/com/medisync/payment/service/PaymentServiceImpl.java`
```java
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
import com.medisync.payment.exception.*;
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
    }

    @Override
    @Transactional
    public PaymentInitiateResponse initiatePayment(UUID appointmentId, UUID patientId) {
        Payment payment = paymentRepository.findByAppointmentId(appointmentId)
                .orElseThrow(() -> new PaymentNotFoundException("Payment record not found"));

        if (payment.getStatus() == PaymentStatus.SUCCESS) {
            throw new PaymentAlreadyCompletedException("Payment already completed");
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

        if ("payment_intent.succeeded".equals(event.getType())) {
            PaymentIntent intent = (PaymentIntent) event.getDataObjectDeserializer().getObject().get();
            updatePaymentStatus(intent.getId(), PaymentStatus.SUCCESS, null);
        } else if ("payment_intent.payment_failed".equals(event.getType())) {
            PaymentIntent intent = (PaymentIntent) event.getDataObjectDeserializer().getObject().get();
            String reason = intent.getLastPaymentError() != null ? intent.getLastPaymentError().getMessage() : "Unknown error";
            updatePaymentStatus(intent.getId(), PaymentStatus.FAILED, reason);
        }
    }

    private void updatePaymentStatus(String intentId, PaymentStatus status, String failureReason) {
        Payment payment = paymentRepository.findByStripePaymentIntentId(intentId).get();
        payment.setStatus(status);
        payment.setFailureReason(failureReason);
        paymentRepository.save(payment);

        if (status == PaymentStatus.SUCCESS) {
            eventPublisher.publishPaymentCompleted(payment);
        }
    }

    @Override
    @Transactional
    public RefundResponse issueRefund(UUID paymentId, RefundRequest request) {
        Payment payment = paymentRepository.findById(paymentId).get();

        try {
            RefundCreateParams params = RefundCreateParams.builder()
                    .setPaymentIntent(payment.getStripePaymentIntentId())
                    .setReason(RefundCreateParams.Reason.REQUESTED_BY_CUSTOMER)
                    .build();
            
            com.stripe.model.Refund stripeRefund = stripeGateway.createRefund(params);

            Refund refund = Refund.builder()
                    .payment(payment)
                    .stripeRefundId(stripeRefund.getId())
                    .amount(payment.getAmount())
                    .status(RefundStatus.SUCCEEDED)
                    .createdAt(LocalDateTime.now())
                    .build();

            refundRepository.save(refund);
            payment.setStatus(PaymentStatus.REFUNDED);
            paymentRepository.save(payment);

            return RefundResponse.builder()
                    .refundId(refund.getRefundId())
                    .amount(refund.getAmount())
                    .status(refund.getStatus())
                    .build();

        } catch (StripeException e) {
            throw new RuntimeException("Refund failed: " + e.getMessage());
        }
    }

    @Override
    public PaymentStatsResponse getPaymentStats() {
        return PaymentStatsResponse.builder()
                .totalPayments(paymentRepository.count())
                .successfulPayments(paymentRepository.countByStatus(PaymentStatus.SUCCESS))
                .totalRevenue(paymentRepository.calculateTotalRevenue())
                .currency(defaultCurrency)
                .build();
    }
}
```

## 2. Telemedicine Service (Backend)

### Controller: SessionController.java
**Path:** `services/telemedicine-service/src/main/java/com/medisync/telemedicine/controller/SessionController.java`
```java
package com.medisync.telemedicine.controller;

import com.medisync.telemedicine.dto.request.CancelSessionRequest;
import com.medisync.telemedicine.dto.request.CreateSessionRequest;
import com.medisync.telemedicine.dto.response.*;
import com.medisync.telemedicine.enums.SessionStatus;
import com.medisync.telemedicine.security.UserPrincipal;
import com.medisync.telemedicine.service.SessionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/sessions")
@RequiredArgsConstructor
@Tag(name = "Telemedicine Sessions")
public class SessionController {
    private final SessionService sessionService;
    private UserPrincipal principal(Authentication a){ return (UserPrincipal)a.getPrincipal(); }

    @PostMapping("/create")
    public ResponseEntity<SessionResponse> create(@Valid @RequestBody CreateSessionRequest request, Authentication auth){ 
        return ResponseEntity.status(HttpStatus.CREATED).body(sessionService.createSession(request, principal(auth))); 
    }

    @GetMapping("/{sessionId}")
    public SessionResponse get(@PathVariable UUID sessionId, Authentication auth){ 
        return sessionService.getSession(sessionId, principal(auth)); 
    }

    @GetMapping("/appointment/{appointmentId}")
    public SessionResponse getByAppointment(@PathVariable UUID appointmentId, Authentication auth){ 
        return sessionService.getSessionByAppointmentId(appointmentId, principal(auth)); 
    }

    @GetMapping("/{sessionId}/token")
    public TokenResponse token(@PathVariable UUID sessionId, Authentication auth){ 
        return sessionService.generateToken(sessionId, principal(auth), false); 
    }

    @PutMapping("/{sessionId}/end")
    public EndSessionResponse end(@PathVariable UUID sessionId, Authentication auth){ 
        return sessionService.endSession(sessionId, principal(auth)); 
    }

    @GetMapping("/stats")
    public SessionStatsResponse stats(Authentication auth){ 
        return sessionService.getStats(principal(auth)); 
    }
}
```

### Service: SessionServiceImpl.java
**Path:** `services/telemedicine-service/src/main/java/com/medisync/telemedicine/service/SessionServiceImpl.java`
```java
package com.medisync.telemedicine.service;

import com.medisync.telemedicine.dto.request.CancelSessionRequest;
import com.medisync.telemedicine.dto.request.CreateSessionRequest;
import com.medisync.telemedicine.dto.response.*;
import com.medisync.telemedicine.entity.Participant;
import com.medisync.telemedicine.entity.Session;
import com.medisync.telemedicine.enums.ParticipantRole;
import com.medisync.telemedicine.enums.SessionStatus;
import com.medisync.telemedicine.exception.*;
import com.medisync.telemedicine.messaging.SessionEventPublisher;
import com.medisync.telemedicine.repository.ParticipantRepository;
import com.medisync.telemedicine.repository.SessionRepository;
import com.medisync.telemedicine.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

@Service @RequiredArgsConstructor
public class SessionServiceImpl implements SessionService {
    private final SessionRepository sessionRepository;
    private final ParticipantRepository participantRepository;
    private final AgoraTokenService agoraTokenService;
    private final SessionEventPublisher sessionEventPublisher;

    @Override
    @Transactional
    public SessionResponse createSession(CreateSessionRequest req, UserPrincipal principal) {
        Session s = sessionRepository.save(Session.builder()
            .appointmentId(req.getAppointmentId())
            .patientId(req.getPatientId())
            .doctorId(req.getDoctorId())
            .channelName("session-"+req.getAppointmentId())
            .status(SessionStatus.WAITING)
            .agoraAppId(agoraTokenService.getAppId())
            .scheduledAt(req.getScheduledAt())
            .build());
        return toResponse(s);
    }

    @Override
    @Transactional
    public TokenResponse generateToken(UUID sessionId, UserPrincipal p, boolean refreshOnly) {
        Session s = sessionRepository.findById(sessionId).get();
        UUID uid = UUID.fromString(p.getUserId());
        
        Participant participant = participantRepository.findBySessionAndUserId(s, uid).orElseGet(() ->
            participantRepository.save(Participant.builder()
                .session(s)
                .userId(uid)
                .role(uid.equals(s.getDoctorId()) ? ParticipantRole.DOCTOR : ParticipantRole.PATIENT)
                .agoraUid(ThreadLocalRandom.current().nextInt(100000, 999999))
                .joinedAt(LocalDateTime.now())
                .build())
        );

        String token = agoraTokenService.generateToken(s.getChannelName(), participant.getAgoraUid());

        if(!refreshOnly){
            if(uid.equals(s.getPatientId())) s.setPatientJoined(true);
            if(uid.equals(s.getDoctorId())) s.setDoctorJoined(true);

            if(Boolean.TRUE.equals(s.getPatientJoined()) && Boolean.TRUE.equals(s.getDoctorJoined()) && s.getStatus()==SessionStatus.WAITING){
                s.setStatus(SessionStatus.ACTIVE);
                s.setStartedAt(LocalDateTime.now());
                sessionEventPublisher.publishSessionStarted(s);
            }
            sessionRepository.save(s);
        }

        return TokenResponse.builder()
            .token(token)
            .channelName(s.getChannelName())
            .agoraAppId(s.getAgoraAppId())
            .uid(participant.getAgoraUid())
            .sessionId(s.getSessionId())
            .build();
    }

    @Override
    @Transactional
    public EndSessionResponse endSession(UUID sessionId, UserPrincipal p) {
        Session s = sessionRepository.findById(sessionId).get();
        s.setStatus(SessionStatus.ENDED);
        s.setEndedAt(LocalDateTime.now());
        s.setDurationMinutes((int) ChronoUnit.MINUTES.between(s.getStartedAt(), s.getEndedAt()));
        
        sessionRepository.save(s);
        sessionEventPublisher.publishSessionEnded(s);
        return EndSessionResponse.builder().sessionId(s.getSessionId()).status(s.getStatus()).build();
    }

    private SessionResponse toResponse(Session s){ return SessionResponse.builder().sessionId(s.getSessionId()).appointmentId(s.getAppointmentId()).channelName(s.getChannelName()).status(s.getStatus()).agoraAppId(s.getAgoraAppId()).scheduledAt(s.getScheduledAt()).build(); }
}
```

## 3. Frontend Implementation (Next.js)

### Page: Payment Checkout (payment/page.tsx)
**Path:** `client/app/patient/payment/page.tsx`
```tsx
"use client"
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import { paymentApiService } from '@/services/paymentApi'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { CreditCard, Shield, Lock, CheckCircle, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

function CardForm({ clientSecret, amount, currency, onSuccess, onError }: any) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return
    setIsProcessing(true)
    try {
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: elements.getElement(CardElement)! }
      })
      if (error) onError(error.message)
      else if (paymentIntent?.status === 'succeeded') onSuccess()
    } finally { setIsProcessing(false) }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-4 border border-slate-200 rounded-xl bg-white"><CardElement /></div>
      <button className="w-full bg-primary-600 text-white py-4 rounded-xl font-bold">
        {isProcessing ? 'Processing...' : `Pay ${currency.toUpperCase()} ${amount}`}
      </button>
    </form>
  )
}

function PaymentContent() {
  const searchParams = useSearchParams()
  const appointmentId = searchParams.get('appointmentId') || ''
  const [paymentData, setPaymentData] = useState<any>(null)
  const [stripePromise, setStripePromise] = useState<any>(null)

  useEffect(() => {
    paymentApiService.initiatePayment(appointmentId).then(data => {
      setPaymentData(data)
      setStripePromise(loadStripe(data.stripePublishableKey))
    })
  }, [appointmentId])

  return (
    <div className="max-w-md mx-auto py-20">
      {paymentData && stripePromise && (
        <Elements stripe={stripePromise}>
          <CardForm 
            clientSecret={paymentData.clientSecret} 
            amount={paymentData.amount} 
            currency={paymentData.currency}
            onSuccess={() => toast.success('Payment Success')}
          />
        </Elements>
      )}
    </div>
  )
}

export default function PaymentPage() {
  return <Suspense><PaymentContent /></Suspense>
}
```

### Page: Telemedicine Session (telemedicine/page.tsx)
**Path:** `client/app/telemedicine/page.tsx`
```tsx
"use client"
import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { telemedicineApiService } from '@/services/telemedicineApi'
import { Mic, Video, PhoneOff } from 'lucide-react'
import toast from 'react-hot-toast'

export default function TelemedicinePage() {
  const searchParams = useSearchParams()
  const appointmentId = searchParams.get('appointmentId')
  const [remoteUsers, setRemoteUsers] = useState<any[]>([])
  const remoteVideoRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const initCall = async () => {
      const session = await telemedicineApiService.getSessionByAppointment(appointmentId!)
      const tokenInfo = await telemedicineApiService.getToken(session.sessionId)
      
      const AgoraRTC = (await import('agora-rtc-sdk-ng')).default
      const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' })
      
      client.on('user-published', async (user, mediaType) => {
        await client.subscribe(user, mediaType)
        if (mediaType === 'video') {
          setRemoteUsers([user])
          user.videoTrack?.play(remoteVideoRef.current!)
        }
      })
      
      await client.join(tokenInfo.agoraAppId, tokenInfo.channelName, tokenInfo.token, tokenInfo.uid)
      const [audio, video] = await AgoraRTC.createMicrophoneAndCameraTracks()
      await client.publish([audio, video])
    }
    initCall()
  }, [appointmentId])

  return (
    <div className="h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
      <div ref={remoteVideoRef} className="w-full h-full bg-black" />
      <div className="absolute bottom-10 flex gap-4">
        <button className="p-4 bg-slate-800 rounded-full"><Mic /></button>
        <button className="p-4 bg-slate-800 rounded-full"><Video /></button>
        <button className="p-4 bg-rose-600 rounded-full"><PhoneOff /></button>
      </div>
    </div>
  )
}
```

### API Service: paymentApi.ts
**Path:** `client/services/paymentApi.ts`
```tsx
import api from './api'

export const paymentApiService = {
  initiatePayment: async (appointmentId: string) => {
    const res = await api.post('/v1/payments/initiate', { appointmentId })
    return res.data
  },
  getPaymentByAppointment: async (appointmentId: string) => {
    const res = await api.get(`/v1/payments/appointment/${appointmentId}`)
    return res.data
  }
}
```

### API Service: telemedicineApi.ts
**Path:** `client/services/telemedicineApi.ts`
```tsx
import axios from 'axios'

const telemedicineApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_TELE_API_URL || 'http://localhost:8084/api/v1',
})

export const telemedicineApiService = {
  getSessionByAppointment: async (appointmentId: string) => {
    const res = await telemedicineApi.get(`/sessions/appointment/${appointmentId}`)
    return res.data
  },
  getToken: async (sessionId: string) => {
    const res = await telemedicineApi.get(`/sessions/${sessionId}/token`)
    return res.data
  },
  endSession: async (sessionId: string) => {
    const res = await telemedicineApi.put(`/sessions/${sessionId}/end`)
    return res.data
  }
}
```
