package com.medisync.payment.stripe;

import com.stripe.exception.SignatureVerificationException;
import com.stripe.exception.StripeException;
import com.stripe.model.Event;
import com.stripe.model.PaymentIntent;
import com.stripe.model.Refund;
import com.stripe.net.Webhook;
import com.stripe.param.PaymentIntentCreateParams;
import com.stripe.param.RefundCreateParams;
import org.springframework.stereotype.Component;

@Component
public class StripeGateway {

    public PaymentIntent createPaymentIntent(PaymentIntentCreateParams params) throws StripeException {
        return PaymentIntent.create(params);
    }

    public Refund createRefund(RefundCreateParams params) throws StripeException {
        return Refund.create(params);
    }

    public Event constructWebhookEvent(String payload, String sigHeader, String secret)
            throws SignatureVerificationException {
        return Webhook.constructEvent(payload, sigHeader, secret);
    }
}
