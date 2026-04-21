package com.medisync.telemedicine.exception;

import com.medisync.telemedicine.dto.response.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.amqp.AmqpException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.List;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(SessionNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(SessionNotFoundException ex, HttpServletRequest req) { return build(HttpStatus.NOT_FOUND, ex.getMessage(), req, null); }
    @ExceptionHandler(SessionAlreadyExistsException.class)
    public ResponseEntity<ErrorResponse> handleExists(SessionAlreadyExistsException ex, HttpServletRequest req) { return build(HttpStatus.CONFLICT, ex.getMessage(), req, null); }
    @ExceptionHandler(SessionAlreadyEndedException.class)
    public ResponseEntity<ErrorResponse> handleEnded(SessionAlreadyEndedException ex, HttpServletRequest req) { return build(HttpStatus.CONFLICT, ex.getMessage(), req, null); }
    @ExceptionHandler(InvalidSessionStateException.class)
    public ResponseEntity<ErrorResponse> handleState(InvalidSessionStateException ex, HttpServletRequest req) { return build(HttpStatus.BAD_REQUEST, ex.getMessage(), req, null); }
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleDenied(AccessDeniedException ex, HttpServletRequest req) { return build(HttpStatus.FORBIDDEN, ex.getMessage(), req, null); }
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex, HttpServletRequest req) {
        List<String> fields = ex.getBindingResult().getFieldErrors().stream().map(FieldError::getDefaultMessage).toList();
        return build(HttpStatus.BAD_REQUEST, "Validation failed", req, fields);
    }
    @ExceptionHandler(AmqpException.class)
    public ResponseEntity<ErrorResponse> handleAmqp(AmqpException ex, HttpServletRequest req) { return build(HttpStatus.INTERNAL_SERVER_ERROR, "Messaging service error", req, null); }
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleAny(Exception ex, HttpServletRequest req) { return build(HttpStatus.INTERNAL_SERVER_ERROR, ex.getMessage(), req, null); }

    private ResponseEntity<ErrorResponse> build(HttpStatus status, String message, HttpServletRequest req, List<String> fieldErrors) {
        return ResponseEntity.status(status).body(ErrorResponse.builder()
                .timestamp(LocalDateTime.now()).status(status.value()).error(status.name()).message(message)
                .path(req.getRequestURI()).fieldErrors(fieldErrors).build());
    }
}
