package com.medisync.payment.exception;

public class PaymentAlreadyCompletedException extends RuntimeException {

    public PaymentAlreadyCompletedException(String message) {
        super(message);
    }

    public PaymentAlreadyCompletedException(String message, Throwable cause) {
        super(message, cause);
    }
}
